import { env } from "cloudflare:workers";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { POST as sohbet } from "@/app/api/chat/route";
import { akisKartSchema } from "@/lib/akis-paket";
import { kartBul, uretilenKartlar } from "@/lib/akis-sunucu";
import { sseMetni, uretKartlariniKur, uretPromptu, URET_ADET_SINIRI, URET_KART_SINIRI } from "@/lib/akis-uret";
import { kodBlogu } from "@/lib/akis-yukle";

const BASLIK = { "Cache-Control": "private, no-store" };

const istekSchema = z
  .object({
    istek: z.string().trim().min(1).max(300),
    ders: z.enum(["EBLG351", "EBLG359"]).optional(),
    hafta: z.number().int().min(1).max(16).optional(),
    adet: z.number().int().min(1).max(URET_ADET_SINIRI).default(3),
    kartId: z.string().trim().max(256).optional(), // konu örneği olarak bakılan kart
  })
  .strict();

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });
  return Response.json({ kartlar: await uretilenKartlar(user.userId) }, { headers: BASLIK });
}

// Model yüksek efor kipinde (context.kind = "akis-uret") soru üretir; çıktı şemadan geçmeyen kart saklanmaz.
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });
  const db = env.DB;
  if (!db) return Response.json({ error: "Veritabanı bağlantısı kurulamadı." }, { status: 500, headers: BASLIK });

  const p = istekSchema.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: p.error.issues[0]?.message || "Geçersiz istek." }, { status: 400, headers: BASLIK });

  const sayi = await db.prepare("SELECT COUNT(*) AS n FROM akis_uretilen WHERE user_id = ?").bind(user.userId).first<{ n: number }>();
  const yer = URET_KART_SINIRI - Number(sayi?.n ?? 0);
  if (yer <= 0) return Response.json({ error: "Üretilmiş soru sınırına ulaştın; eskilerden sil." }, { status: 409, headers: BASLIK });

  let ornek: { soru: string; kod?: string; etiketler: string[] } | undefined;
  let ders = p.data.ders;
  let hafta = p.data.hafta;
  if (p.data.kartId) {
    const k = await kartBul(user.userId, p.data.kartId.replace(/^pak:/, ""));
    if (k) {
      ders ??= k.ders;
      hafta ??= k.hafta;
      const kod = (await kodBlogu(k)).map((s) => s.metin).join("\n");
      ornek = { soru: k.soru, kod: kod || undefined, etiketler: k.etiketler };
    }
  }

  if (!ders || !hafta) return Response.json({ error: "Ders ve hafta ya da geçerli bir kart gerekli." }, { status: 400, headers: BASLIK });

  const adet = Math.min(p.data.adet, yer);
  const istek = new Request(new URL("/api/chat", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: uretPromptu({ istek: p.data.istek, ders, hafta, adet, ornek }) }],
      context: { kind: "akis-uret" },
    }),
  });
  const yanit = await sohbet(istek);
  if (!yanit.ok) return Response.json({ error: "Model yanıt vermedi." }, { status: 502, headers: BASLIK });

  const { kartlar, reddedilen } = uretKartlariniKur(
    sseMetni(await yanit.text()),
    { ders, hafta },
    () => crypto.randomUUID().slice(0, 12),
    (aday) => akisKartSchema.safeParse(aday)
  );
  if (kartlar.length === 0) {
    return Response.json({ error: "Model geçerli soru üretemedi; tekrar dene.", reddedilen }, { status: 502, headers: BASLIK });
  }

  const simdi = new Date().toISOString();
  await db.batch(
    kartlar.map((k) =>
      db
        .prepare("INSERT INTO akis_uretilen (user_id, id, kart, istek, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(user.userId, k.id, JSON.stringify(k), p.data.istek, simdi)
    )
  );
  return Response.json({ kartlar, reddedilen }, { headers: BASLIK });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id.startsWith("uret-") || !env.DB) return Response.json({ error: "Geçersiz kimlik." }, { status: 400, headers: BASLIK });
  await env.DB.prepare("DELETE FROM akis_uretilen WHERE user_id = ? AND id = ?").bind(user.userId, id).run();
  return Response.json({ ok: true }, { headers: BASLIK });
}
