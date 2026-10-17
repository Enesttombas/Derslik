// Yapay zekâ ile soru üretimi: istem kurar, model çıktısını ayıklar ve kart şemasından geçirir. Saf modül (zod + akis-paket).
import type { AkisKart } from "./akis-paket";

// Şema doğrulayıcı dışarıdan verilir: modül Node testlerinde uzantısız içe aktarma gerektirmez.
export type KartDogrula = (aday: unknown) => { success: true; data: AkisKart } | { success: false };

export const URET_ONEKI = "uret-";
export const URET_KART_SINIRI = 100; // kullanıcı başına saklanan üretilmiş kart
export const URET_ADET_SINIRI = 5; // tek istekte

export const uretKartiMi = (id: string) => id.startsWith(URET_ONEKI);

export interface UretIstegi {
  istek: string;
  ders: "EBLG351" | "EBLG359";
  hafta: number;
  adet: number;
  ornek?: { soru: string; kod?: string; etiketler: string[] };
}

export function uretPromptu(i: UretIstegi): string {
  const ornek = i.ornek
    ? `\nKonu örneği (bu karta benzer konuda sor):\nSoru: ${i.ornek.soru}\nEtiketler: ${i.ornek.etiketler.join(", ")}${i.ornek.kod ? `\nKod:\n${i.ornek.kod.slice(0, 1500)}` : ""}\n`
    : "";
  return (
    `Üniversite ${i.ders} dersi, ${i.hafta}. hafta için ${i.adet} adet çoktan seçmeli kod okuma sorusu üret.\n` +
    `Öğrencinin isteği: ${i.istek.slice(0, 300)}\n${ornek}\n` +
    "Kurallar: yalnız geçerli JSON dizisi döndür, başka metin veya kod çiti yazma. Her eleman şu alanlara sahip olsun: " +
    '"soru" (Türkçe), "kod" (kısa Python parçası, en fazla 15 satır), "secenekler" (4 benzersiz kısa şık), ' +
    '"dogru" (doğru şıkkın 0 tabanlı indeksi), "aciklama" (neden doğru, kısa), "etiketler" (1-3 kısa konu etiketi). ' +
    "Kodu kafanda adım adım çalıştır ve doğru şıkkı gerçekten doğrula; emin olmadığın soruyu üretme."
  );
}

// Model çıktısı kod çiti veya önsöz içerebilir: ilk '[' ile son ']' arasını al.
export function jsonDizisiAyikla(metin: string): unknown[] | null {
  const a = metin.indexOf("[");
  const b = metin.lastIndexOf("]");
  if (a === -1 || b <= a) return null;
  try {
    const v = JSON.parse(metin.slice(a, b + 1)) as unknown;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export function uretKartlariniKur(
  metin: string,
  ctx: { ders: UretIstegi["ders"]; hafta: number },
  yeniId: () => string,
  dogrula: KartDogrula
): { kartlar: AkisKart[]; reddedilen: number } {
  const ham = jsonDizisiAyikla(metin);
  if (!ham) return { kartlar: [], reddedilen: 0 };
  const kartlar: AkisKart[] = [];
  let reddedilen = 0;
  for (const h of ham.slice(0, URET_ADET_SINIRI)) {
    const o = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
    const r = dogrula({
      id: `${URET_ONEKI}${yeniId()}`,
      tur: "kod-oku",
      ders: ctx.ders,
      hafta: ctx.hafta,
      kod: o.kod,
      etiketler: o.etiketler,
      soru: o.soru,
      aciklama: o.aciklama,
      secenekler: o.secenekler,
      dogru: o.dogru,
    });
    if (r.success) kartlar.push(r.data);
    else reddedilen++;
  }
  return { kartlar, reddedilen };
}

// SSE gövdesinden (`data: {"delta":"..."}`) metni birleştirir.
export function sseMetni(govde: string): string {
  let metin = "";
  for (const parca of govde.split(/\r?\n\r?\n/)) {
    const satir = parca.trim();
    if (!satir.startsWith("data:")) continue;
    const veri = satir.slice(5).trim();
    if (veri === "[DONE]") continue;
    try {
      const d = (JSON.parse(veri) as { delta?: unknown }).delta;
      if (typeof d === "string") metin += d;
    } catch {
      /* bozuk parça */
    }
  }
  return metin;
}
