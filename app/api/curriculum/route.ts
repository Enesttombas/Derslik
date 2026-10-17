import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { courses, studyItems } from "@/db/schema";
import {
  CURRICULUM_ID_PREFIX,
  curriculumCardId,
  curriculumFor,
  curriculumKeyFromCardId,
} from "@/lib/curriculum-source";
import { and, eq, like } from "drizzle-orm";

async function importedKeys(userId: string, courseId?: string) {
  const db = getDb();
  const conditions = [eq(studyItems.userId, userId), like(studyItems.id, `${CURRICULUM_ID_PREFIX}%`)];
  if (courseId) conditions.push(eq(studyItems.courseId, courseId));
  const rows = await db.select({ id: studyItems.id }).from(studyItems).where(and(...conditions));
  return new Set(rows.map((row) => curriculumKeyFromCardId(row.id)).filter(Boolean) as string[]);
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    const db = getDb();
    const userCourses = await db.select().from(courses).where(eq(courses.userId, user.userId));
    const imported = await importedKeys(user.userId);

    const pool = userCourses.map((course) => {
      const weeks = new Map<number, { week: number; title: string; total: number; imported: number }>();
      for (const q of curriculumFor(course.code)) {
        const entry = weeks.get(q.week) ?? { week: q.week, title: q.weekTitle, total: 0, imported: 0 };
        entry.total += 1;
        if (imported.has(q.key)) entry.imported += 1;
        weeks.set(q.week, entry);
      }
      const list = [...weeks.values()].sort((a, b) => a.week - b.week);
      return {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.title,
        weeks: list,
        nextWeek: list.find((w) => w.imported < w.total) ?? null,
      };
    });

    return Response.json({ pool });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Müfredat soruları alınamadı";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { courseId?: string; week?: number };
    const courseId = payload.courseId?.trim();
    const week = Number(payload.week);
    if (!courseId || !Number.isInteger(week) || week < 1) {
      return Response.json({ error: "Ders ve hafta zorunludur." }, { status: 400 });
    }

    const db = getDb();
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.id, courseId), eq(courses.userId, user.userId)))
      .limit(1);
    if (!course) {
      return Response.json({ error: "Ders bulunamadı veya yetkiniz yok." }, { status: 404 });
    }

    const questions = curriculumFor(course.code).filter((q) => q.week === week);
    if (questions.length === 0) {
      return Response.json({ error: "Bu hafta için hazır soru yok." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const inserted = await db
      .insert(studyItems)
      .values(
        questions.map((q) => ({
          id: curriculumCardId(q.key, user.userId),
          courseId,
          unitId: null,
          pdfSourceId: null,
          sourcePage: null,
          userId: user.userId,
          kind: "question" as const,
          prompt: q.prompt,
          answer: q.answer,
          hint: `Hafta ${q.week} — ${q.weekTitle}`,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitionCount: 0,
          nextReviewAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: studyItems.id });

    return Response.json({ added: inserted.length, total: questions.length }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Müfredat soruları eklenemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
