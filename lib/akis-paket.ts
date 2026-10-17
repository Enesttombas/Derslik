import { z } from "zod";

// Akış v2 kart paketi sözleşmesi (AKIS-PLANI.md). Saf modül: yalnız zod.

export const AKIS_TURLERI = [
  "kod-oku",
  "ne-olur",
  "cikti-tahmin",
  "hata-bul",
  "acikla",
  "sinav",
  "odev",
  "karmasiklik",
] as const;

const metin = (max: number) => z.string().trim().min(1).max(max);

const ortak = {
  id: metin(128),
  ders: z.enum(["EBLG351", "EBLG359"]),
  hafta: z.number().int().min(1).max(16),
  odev: z.string().trim().min(1).max(64).optional(),
  // Ödev kartlarında kod gerçek dosyadan kesilir (dosya+satirlar); not kartlarında kod karta gömülür (kod).
  dosya: metin(256)
    .refine((d) => !d.startsWith("/") && !/^[a-zA-Z]:/.test(d) && !d.split(/[\\/]/).includes(".."), {
      message: "dosya göreli olmalı, '..' içermemeli",
    })
    .optional(),
  satirlar: z.tuple([z.number().int().min(1), z.number().int().min(1)]).refine(([a, b]) => b >= a, {
    message: "satirlar [baslangic, bitis] ve bitis >= baslangic olmalı",
  }).optional(),
  kod: metin(4000).optional(),
  etiketler: z.array(metin(40)).min(1).max(8),
  soru: metin(2000),
  aciklama: metin(4000),
  sinav: metin(2000).optional(),
};

const secimli = {
  secenekler: z.array(metin(500)).min(2).max(5),
  dogru: z.number().int().min(0),
};

const kart = <T extends string, S extends z.ZodRawShape>(tur: T, ek: S) =>
  z.object({ ...ortak, tur: z.literal(tur), ...ek }).strict();

const yol = z.string().startsWith("/").max(256);

export const akisKartSchema = z
  .discriminatedUnion("tur", [
    kart("kod-oku", secimli),
    kart("ne-olur", {
      ...secimli,
      degisiklik: z.object({ eski: metin(500), yeni: metin(500) }).strict(),
      kanit: metin(4000),
      gorsel: z.object({ once: yol, sonra: yol }).strict().optional(),
    }),
    kart("cikti-tahmin", { ...secimli, kanit: metin(4000) }),
    // kod: satirlar bloğunun bilerek bozulmuş sürümü; hataSatir bu bloğa göre (1 tabanlı)
    kart("hata-bul", { kod: metin(4000), hataSatir: z.number().int().min(1) }),
    kart("acikla", {}),
    kart("sinav", { dogruMu: z.boolean() }),
    kart("odev", { adimlar: z.array(metin(500)).min(3).max(10) }),
    kart("karmasiklik", secimli),
  ])
  .superRefine((k, ctx) => {
    if (!k.kod && !(k.dosya && k.satirlar)) ctx.addIssue({ code: "custom", path: ["kod"], message: "kod veya dosya+satirlar gerekli" });
    if (k.odev && !(k.dosya && k.satirlar)) ctx.addIssue({ code: "custom", path: ["dosya"], message: "ödev kartı dosya+satirlar ister" });
    if ("secenekler" in k) {
      if (k.dogru >= k.secenekler.length) ctx.addIssue({ code: "custom", path: ["dogru"], message: "dogru indeksi seçenek sayısını aşıyor" });
      if (new Set(k.secenekler).size !== k.secenekler.length) ctx.addIssue({ code: "custom", path: ["secenekler"], message: "seçenekler benzersiz olmalı" });
    }
    if (k.tur === "hata-bul" && k.hataSatir > k.kod.split(/\r?\n/).length) {
      ctx.addIssue({ code: "custom", path: ["hataSatir"], message: "hataSatir kod bloğunun satır sayısını aşıyor" });
    }
  });

export const akisPaketSchema = z
  .object({ surum: z.literal(1), kartlar: z.array(akisKartSchema).min(1) })
  .strict();

export type AkisKart = z.infer<typeof akisKartSchema>;
export type AkisPaket = z.infer<typeof akisPaketSchema>;
export type AkisTur = (typeof AKIS_TURLERI)[number];
