import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { POST as sohbet } from "@/app/api/chat/route";
import { getDb } from "@/db";
import { courses, studyItems, units } from "@/db/schema";
import { jsonDizisiAyikla, sseMetni } from "@/lib/akis-uret";
import {
  KART_TIPLERI,
  KART_URET_ADET_SINIRI,
  KART_URET_DERS_SINIRI,
  kartlariAyikla,
  kartUretPromptu,
} from "@/lib/kart-uret";

const BASLIK = { "Cache-Control": "private, no-store" };

const istekSchema = z
  .object({
    courseId: z.string().trim().min(1).max(128).optional(), // yoksa tüm dersler
    istek: z.string().trim().max(300).optional(),
    tip: z.enum(Object.keys(KART_TIPLERI) as [keyof typeof KART_TIPLERI, ...(keyof typeof KART_TIPLERI)[]]).optional(),
    adet: z.number().int().min(1).max(KART_URET_ADET_SINIRI).default(5),
    kartId: z.string().trim().max(128).optional(), // konu örneği olarak bakılan kart
  })
  .strict();

// Her ders için model yüksek efor kipinde (context.kind = "akis-uret") çağrılır; geçerli kartlar study_items'a yazılır.
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401, headers: BASLIK });

  const p = istekSchema.safeParse(await request.json().catch(() => null));
  if (!p.success) return Response.json({ error: p.error.issues[0]?.message || "Geçersiz istek." }, { status: 400, headers: BASLIK });

  try {
    const db = getDb();
    const tumDersler = await db.select().from(courses).where(eq(courses.userId, user.userId));
    const hedef = p.data.courseId ? tumDersler.filter((c) => c.id === p.data.courseId) : tumDersler.slice(0, KART_URET_DERS_SINIRI);
    if (hedef.length === 0) {
      return Response.json({ error: p.data.courseId ? "Ders bulunamadı." : "Önce bir ders ekle." }, { status: 404, headers: BASLIK });
    }

    let ornek: { prompt: string; answer: string } | undefined;
    if (p.data.kartId) {
      const [k] = await db.select().from(studyItems).where(and(eq(studyItems.id, p.data.kartId), eq(studyItems.userId, user.userId))).limit(1);
      if (k) ornek = { prompt: k.prompt, answer: k.answer };
    }
    // Tek dersten istenince tam adet; tüm derslerde ders başına en fazla 3.
    const adet = p.data.courseId ? p.data.adet : Math.min(p.data.adet, 3);

    const sonuclar = await Promise.all(
      hedef.map(async (ders) => {
        const [uniteler, mevcut] = await Promise.all([
          db.select().from(units).where(and(eq(units.courseId, ders.id), eq(units.userId, user.userId))),
          db
            .select({ prompt: studyItems.prompt })
            .from(studyItems)
            .where(and(eq(studyItems.courseId, ders.id), eq(studyItems.userId, user.userId)))
            .orderBy(desc(studyItems.createdAt))
            .limit(15),
        ]);
        const istek = new Request(new URL("/api/chat", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: kartUretPromptu({
                  ders: { kod: ders.code, baslik: ders.title },
                  uniteler: uniteler.map((u) => u.title),
                  mevcut: mevcut.map((m) => m.prompt),
                  istek: p.data.istek,
                  tip: p.data.tip,
                  adet,
                  ornek,
                }),
              },
            ],
            context: { kind: "akis-uret" },
          }),
        });
        const yanit = await sohbet(istek);
        if (!yanit.ok) return { ders, kartlar: [], reddedilen: 0, hata: true };
        const { kartlar, reddedilen } = kartlariAyikla(jsonDizisiAyikla(sseMetni(await yanit.text())), adet);
        return { ders, kartlar, reddedilen, hata: false };
      }),
    );

    const simdi = new Date().toISOString();
    const eklenecek = sonuclar.flatMap((s) =>
      s.kartlar.map((k) => ({
        id: `crd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        courseId: s.ders.id,
        unitId: null,
        pdfSourceId: null,
        sourcePage: null,
        userId: user.userId,
        kind: "question" as const,
        prompt: k.prompt,
        answer: k.svg ? `${k.answer}\n\n\`\`\`svg\n${k.svg}\n\`\`\`` : k.answer,
        hint: k.hint,
        intervalDays: 0,
        easeFactor: 2.5,
        repetitionCount: 0,
        nextReviewAt: simdi,
        createdAt: simdi,
        updatedAt: simdi,
      })),
    );
    if (eklenecek.length === 0) {
      return Response.json({ error: "Model geçerli soru üretemedi; tekrar dene." }, { status: 502, headers: BASLIK });
    }
    // D1 tek sorguda en fazla 100 bağlı parametre alır (satır başına ~14): 6'şarlı parçalar halinde yaz.
    const kaydedilen: (typeof studyItems.$inferSelect)[] = [];
    for (let i = 0; i < eklenecek.length; i += 6) {
      kaydedilen.push(...(await db.insert(studyItems).values(eklenecek.slice(i, i + 6)).returning()));
    }
    return Response.json(
      {
        eklenen: kaydedilen.length,
        dersler: sonuclar.map((s) => ({ courseId: s.ders.id, kod: s.ders.code, adet: s.kartlar.length, hata: s.hata })),
        kartlar: kaydedilen,
      },
      { headers: BASLIK },
    );
  } catch (error) {
    const mesaj = error instanceof Error ? error.message : "Soru üretilemedi";
    return Response.json({ error: mesaj }, { status: 500, headers: BASLIK });
  }
}
