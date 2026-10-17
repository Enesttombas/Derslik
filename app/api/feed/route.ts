import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getFeedCards,
  getFeedStats,
  verifyCourseOwnership,
} from "@/lib/study-feed-server";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json(
      { error: "Giriş yapmanız gerekiyor." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const url = new URL(request.url);
  const modeParam = url.searchParams.get("mode") || "learn";
  if (modeParam !== "learn" && modeParam !== "practice") {
    return Response.json(
      { error: "Geçersiz mod parametresi. 'learn' veya 'practice' olmalıdır." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const courseIdParam = url.searchParams.get("courseId")?.trim() || undefined;

  try {
    if (courseIdParam) {
      const ownsCourse = await verifyCourseOwnership(user.userId, courseIdParam);
      if (!ownsCourse) {
        return Response.json(
          { error: "Ders bulunamadı veya yetkiniz yok." },
          { status: 404, headers: { "Cache-Control": "private, no-store" } }
        );
      }
    }

    const [cards, stats] = await Promise.all([
      getFeedCards(user.userId, courseIdParam),
      getFeedStats(user.userId, courseIdParam),
    ]);

    return Response.json(
      { cards, stats },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch {
    return Response.json(
      { error: "Akış yüklenemedi." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
