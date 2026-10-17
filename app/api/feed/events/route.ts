import { getChatGPTUser } from "@/app/chatgpt-auth";
import { feedEventSchema } from "@/lib/study-feed";
import { recordPakEvent } from "@/lib/akis-sunucu";
import { PAK_ONEKI } from "@/lib/akis-olay";
import { readBoundedBody, recordFeedEvent } from "@/lib/study-feed-server";

export async function POST(request: Request) {
  // 1. Consume bounded body stream (up to 32 KiB)
  const bodyResult = await readBoundedBody(request, 32768);
  if (!bodyResult.ok) {
    return Response.json(
      { error: bodyResult.error },
      { status: bodyResult.status, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  // 2. Parse JSON
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(bodyResult.text);
  } catch {
    return Response.json(
      { error: "Geçersiz JSON içeriği." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  // 3. Authenticate user
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json(
      { error: "Giriş yapmanız gerekiyor." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  // 3b. Akış v2 paket kartı: study_items yerine paket kataloğuna karşı, doğruluk sunucuda hesaplanır
  const hamKart = (rawJson as { cardId?: unknown } | null)?.cardId;
  if (typeof hamKart === "string" && hamKart.startsWith(PAK_ONEKI)) {
    try {
      const sonuc = await recordPakEvent(user.userId, rawJson);
      if ("error" in sonuc) {
        return Response.json({ error: sonuc.error }, { status: sonuc.status, headers: { "Cache-Control": "private, no-store" } });
      }
      return Response.json(sonuc.data, { status: 200, headers: { "Cache-Control": "private, no-store" } });
    } catch {
      return Response.json({ error: "Olay kaydedilemedi." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
    }
  }

  // 4. Validate schema
  const parsed = feedEventSchema.safeParse(rawJson);
  if (!parsed.success) {
    const issueMsg = parsed.error.issues[0]?.message || "Geçersiz olay verisi.";
    return Response.json(
      { error: issueMsg },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  // 5. Record event with transactional SM2 review & duplicate handling
  try {
    const result = await recordFeedEvent(user.userId, parsed.data);
    if ("error" in result) {
      return Response.json(
        { error: result.error },
        { status: result.status, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return Response.json(result.data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Olay kaydedilemedi." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
