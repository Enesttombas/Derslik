import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureSchema, getDb } from "@/db";
import { courses, pdfSources, studyItems, units } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  try {
    await ensureSchema(user.userId);
    const db = getDb();

    // Fetch user courses
    const userCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.userId, user.userId));

    // Fetch summary statistics for each course
    const nowIso = new Date().toISOString();

    const courseStats = await Promise.all(
      userCourses.map(async (course) => {
        const [unitCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(units)
          .where(eq(units.courseId, course.id));

        const [pdfCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(pdfSources)
          .where(eq(pdfSources.courseId, course.id));

        const [cardCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(studyItems)
          .where(eq(studyItems.courseId, course.id));

        const [dueCountRow] = await db
          .select({ count: sql<number>`count(*)` })
          .from(studyItems)
          .where(
            sql`${studyItems.courseId} = ${course.id} AND ${studyItems.nextReviewAt} <= ${nowIso}`
          );

        return {
          ...course,
          stats: {
            units: Number(unitCountRow?.count ?? 0),
            pdfs: Number(pdfCountRow?.count ?? 0),
            cards: Number(cardCountRow?.count ?? 0),
            dueCards: Number(dueCountRow?.count ?? 0),
          },
        };
      })
    );

    const totalDue = courseStats.reduce((acc, c) => acc + c.stats.dueCards, 0);
    const totalCards = courseStats.reduce((acc, c) => acc + c.stats.cards, 0);
    const totalPdfs = courseStats.reduce((acc, c) => acc + c.stats.pdfs, 0);

    return Response.json({
      courses: courseStats,
      summary: {
        totalCourses: courseStats.length,
        totalDue,
        totalCards,
        totalPdfs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dersler yüklenirken bir hata oluştu";
    return Response.json({ error: message }, { status: 500 });
  }
}
