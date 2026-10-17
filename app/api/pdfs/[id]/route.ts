import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBucket, getDb } from "@/db";
import { pdfSources } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = await getChatGPTUser();
  if (!user) {
    return new Response("Yetkisiz erişim. Lütfen giriş yapın.", { status: 401 });
  }

  const { id } = await props.params;

  try {
    const db = getDb();
    const [pdf] = await db
      .select()
      .from(pdfSources)
      .where(and(eq(pdfSources.id, id), eq(pdfSources.userId, user.userId)))
      .limit(1);

    if (!pdf) {
      return new Response("PDF bulunamadı veya yetkiniz yok.", { status: 404 });
    }

    const bucket = getBucket();
    const object = await bucket.get(pdf.storageKey);

    if (!object || !object.body) {
      return new Response("PDF dosyası depolama alanında bulunamadı.", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(pdf.fileName)}"`
    );
    headers.set("Cache-Control", "private, max-age=3600");
    if (pdf.fileSize) {
      headers.set("Content-Length", String(pdf.fileSize));
    }

    return new Response(object.body, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF getirilemedi";
    return new Response(message, { status: 500 });
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
    const [pdf] = await db
      .select()
      .from(pdfSources)
      .where(and(eq(pdfSources.id, id), eq(pdfSources.userId, user.userId)))
      .limit(1);

    if (!pdf) {
      return Response.json({ error: "PDF bulunamadı." }, { status: 404 });
    }

    // Delete from R2
    const bucket = getBucket();
    try {
      await bucket.delete(pdf.storageKey);
    } catch {
      // Ignore if already deleted from R2
    }

    // Delete from D1
    await db.delete(pdfSources).where(eq(pdfSources.id, id));

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF silinemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
