import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { courses, studyItems } from "@/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const unitId = searchParams.get("unitId");
  const dueOnly = searchParams.get("dueOnly") === "true";

  try {
    const db = getDb();
    const conditions = [eq(studyItems.userId, user.userId)];

    if (courseId) {
      conditions.push(eq(studyItems.courseId, courseId));
    }
    if (unitId) {
      conditions.push(eq(studyItems.unitId, unitId));
    }
    if (dueOnly) {
      conditions.push(lte(studyItems.nextReviewAt, new Date().toISOString()));
    }

    const rows = await db
      .select()
      .from(studyItems)
      .where(and(...conditions))
      .orderBy(asc(studyItems.nextReviewAt), desc(studyItems.createdAt));

    return Response.json({ cards: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kartlar alınamadı";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      courseId?: string;
      unitId?: string | null;
      pdfSourceId?: string | null;
      sourcePage?: number | null;
      kind?: "question" | "flashcard";
      prompt?: string;
      answer?: string;
      hint?: string | null;
    };

    const courseId = payload.courseId?.trim();
    const prompt = payload.prompt?.trim();
    const answer = payload.answer?.trim();
    const kind = payload.kind === "question" ? "question" : "flashcard";

    if (!courseId || !prompt || !answer) {
      return Response.json(
        { error: "Ders seçimi, soru/prompt metni ve cevap zorunludur." },
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

    const cardId = `crd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const [card] = await db
      .insert(studyItems)
      .values({
        id: cardId,
        courseId,
        unitId: payload.unitId || null,
        pdfSourceId: payload.pdfSourceId || null,
        sourcePage: payload.sourcePage ? Number(payload.sourcePage) : null,
        userId: user.userId,
        kind,
        prompt,
        answer,
        hint: payload.hint?.trim() || null,
        intervalDays: 0,
        easeFactor: 2.5,
        repetitionCount: 0,
        nextReviewAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning();

    return Response.json({ card }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kart oluşturulamadı";
    return Response.json({ error: message }, { status: 500 });
  }
}
