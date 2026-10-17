import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { reviewEvents, studyItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      studyItemId?: string;
      rating?: "again" | "hard" | "good" | "easy";
      userResponse?: string | null;
    };

    const studyItemId = payload.studyItemId?.trim();
    const rating = payload.rating;

    if (!studyItemId || !rating || !["again", "hard", "good", "easy"].includes(rating)) {
      return Response.json(
        { error: "Geçerli bir çalışma öğesi ID ve güven derecelendirmesi (again, hard, good, easy) zorunludur." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [card] = await db
      .select()
      .from(studyItems)
      .where(and(eq(studyItems.id, studyItemId), eq(studyItems.userId, user.userId)))
      .limit(1);

    if (!card) {
      return Response.json({ error: "Çalışma kartı bulunamadı." }, { status: 404 });
    }

    let intervalDays = card.intervalDays;
    let easeFactor = card.easeFactor;
    let repetitionCount = card.repetitionCount;

    if (rating === "again") {
      repetitionCount = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === "hard") {
      repetitionCount += 1;
      intervalDays = Math.max(1, Math.round(Math.max(1, intervalDays) * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (rating === "good") {
      if (repetitionCount === 0) {
        intervalDays = 1;
      } else if (repetitionCount === 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
      }
      repetitionCount += 1;
    } else if (rating === "easy") {
      if (repetitionCount === 0) {
        intervalDays = 3;
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
      }
      easeFactor = easeFactor + 0.15;
      repetitionCount += 1;
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString();
    const nextReviewIso = nextReview.toISOString();

    // Update study item
    await db
      .update(studyItems)
      .set({
        intervalDays,
        easeFactor,
        repetitionCount,
        lastReviewedAt: nowIso,
        nextReviewAt: nextReviewIso,
        updatedAt: nowIso,
      })
      .where(eq(studyItems.id, studyItemId));

    // Record review event
    const eventId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [event] = await db
      .insert(reviewEvents)
      .values({
        id: eventId,
        studyItemId,
        courseId: card.courseId,
        userId: user.userId,
        rating,
        userResponse: payload.userResponse?.trim() || null,
        reviewedAt: nowIso,
      })
      .returning();

    return Response.json({
      success: true,
      event,
      intervalDays,
      nextReviewAt: nextReviewIso,
      repetitionCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tekrar kaydedilemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
