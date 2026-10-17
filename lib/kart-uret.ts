// Sorular sekmesi için yapay zekâ kart üretimi: istem kurar, model çıktısından soru/cevap/ipucu üçlüsünü ayıklar.
// Saf modül (bağımlılık yok); şema denetimi burada elle yapılır, böylece Node testlerinde doğrudan içe aktarılır.

// @ts-expect-error Node strip-types uzantı ister
import { svgUygunMu } from "./svg-guvenli.ts";

export const KART_URET_ADET_SINIRI = 8; // ders başına tek istekte
export const KART_URET_DERS_SINIRI = 6; // "tüm dersler" isteğinde en fazla ders

export const KART_TIPLERI = {
  kavram: "Kavram sorusu: tanım ve neden-sonuç anlayışını sınar.",
  sinav: "Sınav tarzı: üniversite sınavında çıkabilecek, net cevabı olan soru.",
  tuzakli: "Tuzaklı: sık yapılan yanlışı ya da yanlış anlamayı yakalayan soru.",
  hesap: "Hesaplamalı: kısa, elle çözülebilir sayısal ya da adım adım soru.",
  karsilastir: "Karşılaştırma: iki kavramı ya da yöntemi karşılaştırma sorusu.",
  ozet: "Özet kartı: konunun tek paragraflık özünü soru-cevap olarak çıkar.",
} as const;
export type KartTipi = keyof typeof KART_TIPLERI;
export const kartTipiMi = (v: unknown): v is KartTipi => typeof v === "string" && v in KART_TIPLERI;

export interface KartUretIstegi {
  ders: { kod: string; baslik: string };
  uniteler: string[];
  mevcut: string[]; // tekrarı önlemek için bu dersteki mevcut soru başlıkları
  istek?: string;
  tip?: KartTipi;
  adet: number;
  ornek?: { prompt: string; answer: string };
}

export function kartUretPromptu(i: KartUretIstegi): string {
  const satirlar = [
    `Üniversite dersi: ${i.ders.kod} — ${i.ders.baslik}.`,
    i.uniteler.length ? `Ünite başlıkları: ${i.uniteler.slice(0, 20).join("; ")}.` : "",
    `Bu ders için ${i.adet} adet çalışma sorusu üret.`,
    i.tip ? `Soru türü: ${KART_TIPLERI[i.tip]}` : "Soru türlerini çeşitlendir (kavram, tuzaklı, hesaplamalı, karşılaştırma).",
    i.istek ? `Öğrencinin isteği: ${i.istek.slice(0, 300)}` : "",
    i.ornek ? `Bu karta benzer konuda sor:\nSoru: ${i.ornek.prompt.slice(0, 400)}\nCevap: ${i.ornek.answer.slice(0, 400)}` : "",
    i.mevcut.length ? `Şu soruları tekrarlama: ${i.mevcut.slice(0, 15).map((m) => m.slice(0, 80)).join(" | ")}` : "",
    "Kurallar: yalnız geçerli JSON dizisi döndür, başka metin veya kod çiti yazma. Her eleman: " +
      '"prompt" (Türkçe soru), "answer" (kısa ve net cevap; mümkünse tek cümle ya da kısa numaralı adımlar), ' +
      '"hint" (cevabı vermeyen tek cümlelik ipucu). ' +
      "Cevap üslubu ders notu gibi olsun: önce kısa tanım ya da kural, sonra gerekiyorsa $...$ içinde LaTeX formül (örn. $Y=\\neg(A\\cdot B)$), en fazla bir yorum cümlesi. " +
      "Kutu çizim karakterleri, ├─┐ gibi ASCII şemalar ve [AND] tarzı metin çizimleri YASAK; şema gerekiyorsa yalnız svg alanını kullan. " +
      'Soru bir şema, devre, mantık kapısı, graf, ağaç, bellek/bit yerleşimi ya da geometri gibi görselleştirmeyle anlaşılıyorsa ek olarak "svg" alanına çözüm şemasını tek bir <svg> olarak yaz: ' +
      "viewBox='0 0 320 180' gibi, yalnız line/path/rect/circle/polygon/text/g etiketleri, çizgilerde stroke='currentColor' fill='none' stroke-width='2', metinlerde font-size, " +
      "öznitelik değerlerinde yalnız tek tırnak kullan (JSON bozulmasın), hiçbir script/style/image/href olmasın. Görsel gerekmiyorsa \"svg\" alanını hiç yazma. " +
      "Emin olmadığın bilgiyi yazma; uydurma ders içeriği üretme.",
  ];
  return satirlar.filter(Boolean).join("\n");
}

export interface UretilenKart {
  prompt: string;
  answer: string;
  hint: string | null;
  svg: string | null;
}

const kes = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function kartlariAyikla(ham: unknown[] | null, sinir = KART_URET_ADET_SINIRI): { kartlar: UretilenKart[]; reddedilen: number } {
  if (!ham) return { kartlar: [], reddedilen: 0 };
  const kartlar: UretilenKart[] = [];
  const gorulen = new Set<string>();
  let reddedilen = 0;
  for (const h of ham.slice(0, sinir * 2)) {
    const o = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
    const prompt = kes(o.prompt, 600);
    const answer = kes(o.answer, 1500);
    const anahtar = prompt.toLowerCase().replace(/\s+/g, " ");
    if (prompt.length < 8 || answer.length < 2 || gorulen.has(anahtar) || kartlar.length >= sinir) {
      reddedilen += 1;
      continue;
    }
    gorulen.add(anahtar);
    kartlar.push({ prompt, answer, hint: kes(o.hint, 300) || null, svg: svgUygunMu(o.svg) ? o.svg.trim() : null });
  }
  return { kartlar, reddedilen };
}
