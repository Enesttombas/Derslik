import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBucket, getDb } from "@/db";
import { courses, pdfSources } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    const db = getDb();
    const query = db
      .select()
      .from(pdfSources)
      .where(
        courseId
          ? and(eq(pdfSources.courseId, courseId), eq(pdfSources.userId, user.userId))
          : eq(pdfSources.userId, user.userId)
      )
      .orderBy(desc(pdfSources.createdAt));

    const rows = await query;
    return Response.json({ pdfs: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF kaynakları alınamadı";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const courseId = formData.get("courseId")?.toString().trim();
    const unitId = formData.get("unitId")?.toString().trim() || null;

    if (!courseId) {
      return Response.json({ error: "Ders seçimi zorunludur." }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Lütfen geçerli bir PDF dosyası yükleyin." }, { status: 400 });
    }

    // Validation: PDF file type
    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return Response.json(
        { error: "Sadece PDF formatındaki dosyalar kabul edilir." },
        { status: 400 }
      );
    }

    // Validation: File size
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return Response.json(
        { error: `Dosya boyutu en fazla 25 MB olabilir. Yüklenen dosya: ${(file.size / (1024 * 1024)).toFixed(1)} MB` },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify course belongs to user
    const [userCourse] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, user.userId)))
      .limit(1);

    if (!userCourse) {
      return Response.json({ error: "Ders bulunamadı veya yetkiniz yok." }, { status: 404 });
    }

    const pdfId = `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const storageKey = `users/${user.userId}/courses/${courseId}/pdfs/${pdfId}.pdf`;

    // Store PDF bytes in R2
    const bucket = getBucket();
    const buffer = await file.arrayBuffer();
    await bucket.put(storageKey, buffer, {
      httpMetadata: {
        contentType: "application/pdf",
      },
      customMetadata: {
        userId: user.userId,
        courseId,
        fileName: encodeURIComponent(file.name),
      },
    });

    // Store metadata in D1
    const [pdfRecord] = await db
      .insert(pdfSources)
      .values({
        id: pdfId,
        courseId,
        unitId,
        userId: user.userId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: "application/pdf",
        storageKey,
      })
      .returning();

    return Response.json({ pdf: pdfRecord }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF yüklenirken bir hata oluştu";
    return Response.json({ error: message }, { status: 500 });
  }
}
