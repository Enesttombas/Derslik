// Akış v2 sunucu olayları: `pak:` kart kimliği, seçim şeması ve sunucu tarafı doğruluk. Saf modül (zod + akis-paket).
import { z } from "zod";
import type { AkisKart } from "./akis-paket";

export const PAK_ONEKI = "pak:";

export const pakKartId = (id: string) => `${PAK_ONEKI}${id}`;
export const pakKimligi = (cardId: string): string | null => (cardId.startsWith(PAK_ONEKI) ? cardId.slice(PAK_ONEKI.length) : null);

const eventId = z.string().trim().min(1).max(128);
const cardId = z.string().trim().min(1).max(256);

// İstemci yalnız ne seçtiğini bildirir; doğru/yanlış sunucuda paketten hesaplanır.
export const secimSchema = z.discriminatedUnion("tip", [
  z.object({ tip: z.literal("sik"), index: z.number().int().min(0).max(4) }).strict(),
  z.object({ tip: z.literal("satir"), n: z.number().int().min(1).max(500) }).strict(),
  z.object({ tip: z.literal("dogruMu"), deger: z.boolean() }).strict(),
  z.object({ tip: z.literal("sira"), sira: z.array(z.number().int().min(0).max(9)).min(1).max(10) }).strict(),
  z.object({ tip: z.literal("kendi"), anladim: z.boolean() }).strict(),
]);
export type Secim = z.infer<typeof secimSchema>;

export const pakCevapSchema = z
  .object({
    eventId,
    cardId,
    kind: z.literal("answer"),
    mode: z.literal("practice"),
    secim: secimSchema,
    ipucu: z.number().int().min(0).max(3).optional(), // cevaptan önce açılan kademeli ipucu sayısı
  })
  .strict();
export type PakCevap = z.infer<typeof pakCevapSchema>;

const SECIM_TIPI: Record<AkisKart["tur"], Secim["tip"]> = {
  "kod-oku": "sik",
  "ne-olur": "sik",
  "cikti-tahmin": "sik",
  karmasiklik: "sik",
  "hata-bul": "satir",
  sinav: "dogruMu",
  odev: "sira",
  acikla: "kendi",
};

export type Degerlendirme = { ok: true; outcome: "correct" | "incorrect" } | { ok: false; hata: string };

export function degerlendir(kart: AkisKart, secim: Secim): Degerlendirme {
  if (SECIM_TIPI[kart.tur] !== secim.tip) return { ok: false, hata: "Seçim türü kartla uyuşmuyor." };
  let dogru: boolean;
  switch (kart.tur) {
    case "hata-bul":
      dogru = secim.tip === "satir" && secim.n === kart.hataSatir;
      break;
    case "sinav":
      dogru = secim.tip === "dogruMu" && secim.deger === kart.dogruMu;
      break;
    case "odev": {
      // Tam sıra doğru adımlar; yarım sıra (istemci ilk hatada keser) yalnız kısa ama doğru önek ise doğru sayılmaz.
      const sira = secim.tip === "sira" ? secim.sira : [];
      dogru = sira.length === kart.adimlar.length && sira.every((v, i) => v === i);
      break;
    }
    case "acikla":
      dogru = secim.tip === "kendi" && secim.anladim;
      break;
    default: {
      if (secim.tip !== "sik") return { ok: false, hata: "Seçim türü kartla uyuşmuyor." };
      if (secim.index >= kart.secenekler.length) return { ok: false, hata: "Şık dizini seçenek sayısını aşıyor." };
      dogru = secim.index === kart.dogru;
    }
  }
  return { ok: true, outcome: dogru ? "correct" : "incorrect" };
}

export interface CevapSatiri {
  kart: string;
  dogru: boolean;
  t: number; // ms
}

export interface GecTekrar {
  ertesiGun: { dogru: number; toplam: number }; // ilk cevaptan 1-2 gün sonraki tekrarlar
  ucuncuGunVeSonrasi: { dogru: number; toplam: number }; // 3+ gün sonraki tekrarlar
}

// Her kartın ilk cevabı referans; sonraki cevaplar ilk cevaptan geçen güne göre kovalanır (aynı gün içi sayılmaz).
export function gecTekrarHesapla(satirlar: CevapSatiri[]): GecTekrar {
  const ilk = new Map<string, number>();
  for (const s of satirlar) if (!ilk.has(s.kart) || s.t < (ilk.get(s.kart) as number)) ilk.set(s.kart, s.t);
  const sonuc: GecTekrar = { ertesiGun: { dogru: 0, toplam: 0 }, ucuncuGunVeSonrasi: { dogru: 0, toplam: 0 } };
  for (const s of satirlar) {
    const gun = Math.floor((s.t - (ilk.get(s.kart) as number)) / 86400000);
    const kova = gun >= 3 ? sonuc.ucuncuGunVeSonrasi : gun >= 1 ? sonuc.ertesiGun : null;
    if (!kova) continue;
    kova.toplam++;
    if (s.dogru) kova.dogru++;
  }
  return sonuc;
}
