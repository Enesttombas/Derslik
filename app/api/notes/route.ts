import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { courses, studyNotes } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
      .from(studyNotes)
      .where(
        courseId
          ? and(eq(studyNotes.courseId, courseId), eq(studyNotes.userId, user.userId))
          : eq(studyNotes.userId, user.userId)
      )
      .orderBy(desc(studyNotes.updatedAt));

    const rows = await query;
    return Response.json({ notes: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notlar alınamadı";
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
      title?: string;
      content?: string;
    };

    const courseId = payload.courseId?.trim();
    const title = payload.title?.trim();
    const content = payload.content?.trim() ?? "";

    if (!courseId || !title) {
      return Response.json({ error: "Ders ve not başlığı zorunludur." }, { status: 400 });
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

    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [note] = await db
      .insert(studyNotes)
      .values({
        id,
        courseId,
        unitId: payload.unitId || null,
        userId: user.userId,
        title,
        content,
      })
      .returning();

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not kaydedilemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
