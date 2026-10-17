import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { pdfSources, pdfWorkspaces } from "@/db/schema";
import { workspaceDocumentSchema, workspaceSaveSchema } from "@/lib/pdf-workspace";
import { and, eq } from "drizzle-orm";

const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MiB

const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-store",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getChatGPTUser();
  if (!user) {
    return jsonResponse({ error: "Yetkisiz erişim. Lütfen giriş yapın." }, 401);
  }

  const { id } = await props.params;

  try {
    const db = getDb();

    // Verify PDF ownership through pdfSources
    const [pdf] = await db
      .select({ id: pdfSources.id })
      .from(pdfSources)
      .where(and(eq(pdfSources.id, id), eq(pdfSources.userId, user.userId)))
      .limit(1);

    if (!pdf) {
      return jsonResponse({ error: "PDF bulunamadı veya yetkiniz yok." }, 404);
    }

    // Query workspace row
    const [row] = await db
      .select()
      .from(pdfWorkspaces)
      .where(and(eq(pdfWorkspaces.pdfId, id), eq(pdfWorkspaces.userId, user.userId)))
      .limit(1);

    if (!row) {
      return jsonResponse({
        workspace: {
          revision: 0,
          page: 1,
          zoom: 1,
          bookmarks: [],
          annotations: [],
          updatedAt: null,
        },
      });
    }

    const parsedDoc = workspaceDocumentSchema.parse(JSON.parse(row.document));

    return jsonResponse({
      workspace: {
        revision: row.revision,
        page: parsedDoc.page ?? 1,
        zoom: parsedDoc.zoom ?? 1,
        bookmarks: parsedDoc.bookmarks ?? [],
        annotations: parsedDoc.annotations ?? [],
        updatedAt: row.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Çalışma alanı getirilemedi.";
    return jsonResponse({ error: message }, 500);
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getChatGPTUser();
  if (!user) {
    return jsonResponse({ error: "Yetkisiz erişim. Lütfen giriş yapın." }, 401);
  }

  const { id } = await props.params;

  // Drain the request before responding, keeping at most 2 MiB in memory.
  // An early response while the preview proxy is still streaming resets its worker.
  let bodyText = "";
  let bodyBytes = 0;
  try {
    const reader = request.body?.getReader();
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bodyBytes += value.byteLength;
        if (bodyBytes <= MAX_PAYLOAD_BYTES) {
          bodyText += decoder.decode(value, { stream: true });
        } else {
          bodyText = "";
        }
      }
    }
    if (bodyBytes <= MAX_PAYLOAD_BYTES) bodyText += decoder.decode();
  } catch {
    return jsonResponse({ error: "İstek gövdesi okunamadı." }, 400);
  }

  if (bodyBytes > MAX_PAYLOAD_BYTES) {
    return jsonResponse({ error: "İstek boyutu 2 MiB sınırını aşıyor." }, 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return jsonResponse({ error: "Geçersiz JSON biçimi." }, 400);
  }

  const parseResult = workspaceSaveSchema.safeParse(body);
  if (!parseResult.success) {
    return jsonResponse(
      {
        error: "Geçersiz çalışma alanı verisi.",
        issues: parseResult.error.issues,
      },
      400
    );
  }

  const { baseRevision, mutationId, document } = parseResult.data;
  const docJson = JSON.stringify(document);

  try {
    const db = getDb();

    // Verify PDF ownership through pdfSources
    const [pdf] = await db
      .select({ id: pdfSources.id })
      .from(pdfSources)
      .where(and(eq(pdfSources.id, id), eq(pdfSources.userId, user.userId)))
      .limit(1);

    if (!pdf) {
      return jsonResponse({ error: "PDF bulunamadı veya yetkiniz yok." }, 404);
    }

    const [existing] = await db
      .select()
      .from(pdfWorkspaces)
      .where(eq(pdfWorkspaces.pdfId, id))
      .limit(1);

    const now = new Date().toISOString();

    if (!existing) {
      if (baseRevision !== 0) {
        return jsonResponse(
          {
            error: "Çakışma: Başlangıç revizyonu 0 olmalıdır.",
            workspace: {
              revision: 0,
              page: 1,
              zoom: 1,
              bookmarks: [],
              annotations: [],
              updatedAt: null,
            },
          },
          409
        );
      }

      // First insert guarded onConflictDoNothing
      await db
        .insert(pdfWorkspaces)
        .values({
          pdfId: id,
          userId: user.userId,
          revision: 1,
          document: docJson,
          lastMutationId: mutationId,
          updatedAt: now,
        })
        .onConflictDoNothing();

      const [current] = await db
        .select()
        .from(pdfWorkspaces)
        .where(eq(pdfWorkspaces.pdfId, id))
        .limit(1);

      if (!current) {
        return jsonResponse({ error: "Çalışma alanı kaydedilemedi." }, 500);
      }

      if (current.lastMutationId === mutationId) {
        if (current.document !== docJson) {
          return jsonResponse({ error: "Aynı mutationId ile farklı içerik gönderilemez." }, 400);
        }
        let parsed = document;
        try {
          parsed = JSON.parse(current.document);
        } catch {
          // ignore
        }
        return jsonResponse({
          workspace: {
            ...parsed,
            revision: current.revision,
            updatedAt: current.updatedAt,
          },
        });
      }

      // Another concurrent insert won the race
      let conflictDoc: Record<string, unknown> = {};
      try {
        conflictDoc = JSON.parse(current.document);
      } catch {
        // ignore
      }

      return jsonResponse(
        {
          error: "Çakışma: Belge başka bir oturumda oluşturuldu.",
          workspace: {
            ...conflictDoc,
            revision: current.revision,
            updatedAt: current.updatedAt,
          },
        },
        409
      );
    }

    // Existing row found
    if (existing.lastMutationId === mutationId) {
      // Repeat same mutationId/document returns same revision (retry), not increment
      if (existing.document === docJson) {
        let parsed = document;
        try {
          parsed = JSON.parse(existing.document);
        } catch {
          // ignore
        }
        return jsonResponse({
          workspace: {
            ...parsed,
            revision: existing.revision,
            updatedAt: existing.updatedAt,
          },
        });
      } else {
        // Reject changed document under same mutationId
        return jsonResponse(
          { error: "Aynı mutationId ile farklı içerik gönderilemez." },
          400
        );
      }
    }

    // Check baseRevision against current revision
    if (existing.revision !== baseRevision) {
      let conflictDoc: Record<string, unknown> = {};
      try {
        conflictDoc = JSON.parse(existing.document);
      } catch {
        // ignore
      }

      return jsonResponse(
        {
          error: "Çakışma: Belge başka bir oturumda güncellendi.",
          workspace: {
            ...conflictDoc,
            revision: existing.revision,
            updatedAt: existing.updatedAt,
          },
        },
        409
      );
    }

    // Atomic CAS update: compare-and-swap revision in WHERE and require returning row
    const nextRevision = existing.revision + 1;
    const updatedRows = await db
      .update(pdfWorkspaces)
      .set({
        revision: nextRevision,
        document: docJson,
        lastMutationId: mutationId,
        updatedAt: now,
      })
      .where(
        and(
          eq(pdfWorkspaces.pdfId, id),
          eq(pdfWorkspaces.revision, existing.revision)
        )
      )
      .returning();

    if (updatedRows.length === 0) {
      // Concurrent write won CAS race
      const [latest] = await db
        .select()
        .from(pdfWorkspaces)
        .where(eq(pdfWorkspaces.pdfId, id))
        .limit(1);

      let latestDoc: Record<string, unknown> = {};
      if (latest) {
        try {
          latestDoc = JSON.parse(latest.document);
        } catch {
          // ignore
        }
      }

      return jsonResponse(
        {
          error: "Çakışma: Eşzamanlı güncelleme tespit edildi.",
          workspace: latest
            ? {
                ...latestDoc,
                revision: latest.revision,
                updatedAt: latest.updatedAt,
              }
            : null,
        },
        409
      );
    }

    return jsonResponse({
      workspace: {
        ...document,
        revision: updatedRows[0].revision,
        updatedAt: updatedRows[0].updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Çalışma alanı kaydedilemedi.";
    return jsonResponse({ error: message }, 500);
  }
}
