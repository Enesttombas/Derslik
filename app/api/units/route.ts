import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { courses, units } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  if (!courseId) {
    return Response.json({ error: "courseId parametresi zorunludur." }, { status: 400 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(units)
      .where(and(eq(units.courseId, courseId), eq(units.userId, user.userId)))
      .orderBy(asc(units.orderIndex), asc(units.createdAt));

    return Response.json({ units: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Üniteler alınamadı";
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
      title?: string;
      orderIndex?: number;
    };

    const courseId = payload.courseId?.trim();
    const title = payload.title?.trim();

    if (!courseId || !title) {
      return Response.json({ error: "Ders ve ünite başlığı zorunludur." }, { status: 400 });
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

    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [newUnit] = await db
      .insert(units)
      .values({
        id,
        courseId,
        userId: user.userId,
        title,
        orderIndex: payload.orderIndex ?? 0,
      })
      .returning();

    return Response.json({ unit: newUnit }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ünite eklenemedi";
    return Response.json({ error: message }, { status: 500 });
  }
}
