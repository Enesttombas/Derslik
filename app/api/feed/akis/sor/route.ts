import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { POST as sohbet } from "@/app/api/chat/route";
import { secimSchema } from "@/lib/akis-olay";
import { akisSorBaglami, ipucuMesaji, type AkisCevabi } from "@/lib/akis-sor";
import { kartBul } from "@/lib/akis-sunucu";
import { kodBlogu } from "@/lib/akis-yukle";

const BASLIK = { "Cache-Control": "private, no-store" };

// İstemci yalnız kart kimliği ve soru metni gönderir; kart içeriği ve "cevapladı mı" bilgisi sunucuda okunur.
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });

  let govde: { kartId?: unknown; mesaj?: unknown; ipucu?: unknown };
  try {
    govde = (await request.json()) as typeof govde;
  } catch {
    return Response.json({ error: "Geçersiz istek gövdesi." }, { status: 400, headers: BASLIK });
  }
  const seviye = govde.ipucu === 1 || govde.ipucu === 2 || govde.ipucu === 3 ? govde.ipucu : null;
  let mesaj = typeof govde.mesaj === "string" ? govde.mesaj.trim().slice(0, 500) : "";
  const kart = typeof govde.kartId === "string" ? await kartBul(user.userId, govde.kartId) : undefined;
  if (!kart) return Response.json({ error: "Akış kartı bulunamadı." }, { status: 404, headers: BASLIK });
  if (!mesaj && !seviye) return Response.json({ error: "Soru boş olamaz." }, { status: 400, headers: BASLIK });

  let cevap: AkisCevabi | null = null;
  if (env.DB) {
    const satir = await env.DB.prepare(
      "SELECT outcome, secim FROM akis_olaylari WHERE user_id = ? AND kart_id = ? AND kind = 'answer' ORDER BY sequence DESC LIMIT 1"
    )
      .bind(user.userId, `pak:${kart.id}`)
      .first<{ outcome: string; secim: string | null }>();
    if (satir?.secim && (satir.outcome === "correct" || satir.outcome === "incorrect")) {
      const p = secimSchema.safeParse(JSON.parse(satir.secim));
      if (p.success) cevap = { secim: p.data, outcome: satir.outcome };
    }
  }

  // Cevaplanmamış kartta ipucu sunucuda kurulan sabit mesajla istenir; cevap bağlama zaten girmez.
  if (seviye && !cevap) mesaj = ipucuMesaji(seviye);
  const kod = (await kodBlogu(kart)).map((s) => s.metin);
  const istek = new Request(new URL("/api/chat", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: mesaj }], context: akisSorBaglami(kart, kod, cevap) }),
  });
  return sohbet(istek);
}
