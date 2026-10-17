// content/akis paketlerini yükler ve kartın kod bloğunu gerçek dosyadan keser (kart kodu kopyalamaz).
import { akisPaketSchema, type AkisKart } from "./akis-paket";

const paketler = import.meta.glob("../content/akis/*/*.json", { import: "default", eager: true }) as Record<string, unknown>;
const kodDosyalari = import.meta.glob("../content/odevler/eblg35*/**/*.py", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;

export const AKIS_KARTLARI: AkisKart[] = Object.values(paketler).flatMap((p) => {
  const r = akisPaketSchema.safeParse(p);
  return r.success ? r.data.kartlar : [];
});

import kapsamHam from "../content/akis/kapsam.json";

export interface DersKapsami {
  notlar: Record<string, string>; // hafta → başlık
  odevHaftalari: Record<string, string>; // ödev haftası → ad
  odevler: Record<string, [string, string]>; // ödev id → [numara, ad]
}
export const KAPSAM = kapsamHam as unknown as Record<"EBLG351" | "EBLG359", DersKapsami>;

export interface KodSatiri {
  n: number;
  metin: string;
}

export async function kodBlogu(k: AkisKart): Promise<KodSatiri[]> {
  if (k.tur === "hata-bul" || !k.dosya || !k.satirlar) return (k.kod ?? "").split(/\r?\n/).map((metin, i) => ({ n: i + 1, metin }));
  const yukle = kodDosyalari[`../content/odevler/${k.ders.toLowerCase()}/${k.dosya}`];
  if (!yukle) return [];
  const satirlar = (await yukle()).split(/\r?\n/);
  const [ilk, son] = k.satirlar;
  return satirlar.slice(ilk - 1, son).map((metin, i) => ({ n: ilk + i, metin }));
}
