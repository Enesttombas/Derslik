import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { studyItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const payload = (await request.json()) as {
      prompt?: string;
      answer?: string;
      hint?: string | null;
      kind?: "question" | "flashcard";
      unitId?: string | null;
      pdfSourceId?: string | null;
      sourcePage?: number | null;
    };

    const db = getDb();
    const [existing] = await db
      .select()
      .from(studyItems)
      .where(and(eq(studyItems.id, id), eq(studyItems.userId, user.userId)))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Kart bulunamadı." }, { status: 404 });
    }

    const [updated] = await db
      .update(studyItems)
      .set({
        prompt: payload.prompt?.trim() || existing.prompt,
        answer: payload.answer?.trim() || existing.answer,
        hint: payload.hint !== undefined ? (payload.hint?.trim() || null) : existing.hint,
        kind: payload.kind || existing.kind,
        unitId: payload.unitId !== undefined ? payload.unitId : existing.unitId,
        pdfSourceId: payload.pdfSourceId !== undefined ? payload.pdfSourceId : existing.pdfSourceId,
        sourcePage: payload.sourcePage !== undefined ? payload.sourcePage : existing.sourcePage,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(studyItems.id, id))
      .returning();

    return Response.json({ card: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kart güncellenemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(studyItems)
      .where(and(eq(studyItems.id, id), eq(studyItems.userId, user.userId)))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Kart bulunamadı." }, { status: 404 });
    }

    await db.delete(studyItems).where(eq(studyItems.id, id));

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kart silinemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
