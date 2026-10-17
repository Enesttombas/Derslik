// Akış v2 oturum mantığı: kapsam seçimi, sıralama, ilerleme. Saf modül (tarayıcı/DB yok).
import type { AkisKart, AkisTur } from "./akis-paket";

export type AkisDers = "EBLG351" | "EBLG359";
// not: ders notu haftası; odev: ödev haftası (odev yoksa haftanın bütün ödevleri). Kart `odev` alanı doluysa ödev kartıdır.
export type Kapsam =
  | { tip: "genel" }
  | { tip: "not"; hafta: number }
  | { tip: "odev"; hafta: number; odev?: string };

export interface AkisSecim {
  ders: AkisDers;
  kapsam: Kapsam;
  turler: AkisTur[]; // boşsa hepsi
  adet: number;
}

// due/tercih yalnız sunucu durumundan gelir (akis_kart_durumu); yerel kayıtta yoktur.
export type Ilerleme = Record<string, { d: number; y: number; son: "d" | "y" | null; due?: boolean; tercih?: "like" | "dislike" | null }>;

// kolay -> zor (hafta/ödev/dosya kapsamında sıralama)
const ZORLUK: Record<AkisTur, number> = {
  sinav: 0, "kod-oku": 1, karmasiklik: 1, "cikti-tahmin": 2, odev: 2, "ne-olur": 3, "hata-bul": 3, acikla: 4,
};

export function kapsamaUyar(k: AkisKart, kapsam: Kapsam): boolean {
  if (kapsam.tip === "genel") return true;
  if (kapsam.tip === "not") return !k.odev && k.hafta === kapsam.hafta;
  return Boolean(k.odev) && k.hafta === kapsam.hafta && (kapsam.odev === undefined || k.odev === kapsam.odev);
}

// Etiket başına yanlış oranı (Laplace düzeltmeli): 1 yanlış/0 doğru = 0,5; 3 yanlış = 0,75.
export function etiketOranlari(kartlar: AkisKart[], ilerleme: Ilerleme): Map<string, number> {
  return new Map(etiketZayifligi(kartlar, ilerleme).map((z) => [z.etiket, z.y / (z.d + z.y + 1)]));
}

// Sıra: tekrar zamanı (40) > zayıflık (kart + etiket < 32) > yeni (8) > tercih (±6). Zayıflık + tercih < 40 olduğundan
// vadesi gelen kart her zaman önde; etiket zayıflığı henüz çözülmemiş kartı da öne çeker.
export function akisPuani(k: AkisKart, ilerleme: Ilerleme, oranlar: Map<string, number>): number {
  const p = ilerleme[k.id];
  const toplam = p ? p.d + p.y : 0;
  let puan = p?.due ? 40 : 0;
  if (p && toplam > 0) puan += (p.y / (toplam + 1)) * 20;
  else puan += 8;
  const etiketli = k.etiketler.filter((e) => oranlar.has(e));
  if (etiketli.length) puan += (etiketli.reduce((t, e) => t + (oranlar.get(e) ?? 0), 0) / etiketli.length) * 12;
  if (p?.tercih === "like") puan += 6;
  else if (p?.tercih === "dislike") puan -= 6;
  return puan;
}

// Aynı türden veya aynı ana konudan (ilk etiket) art arda en fazla `sinir` kart: gerekirse sıradaki uygun kartı öne çek.
export function turleriKaristir(liste: AkisKart[], sinir = 2): AkisKart[] {
  const kalan = [...liste];
  const sonuc: AkisKart[] = [];
  while (kalan.length) {
    const son = sonuc.slice(-sinir);
    const tikali = (anahtar: (k: AkisKart) => string) => son.length === sinir && son.every((k) => anahtar(k) === anahtar(son[0]));
    const tur = tikali((k) => k.tur) ? son[0].tur : null;
    const konu = tikali((k) => k.etiketler[0]) ? son[0].etiketler[0] : null;
    // Önce iki sınırı birden gözet; olmazsa tür sınırını, sonra konu sınırını koru.
    const adaylar = [
      (k: AkisKart) => k.tur !== tur && k.etiketler[0] !== konu,
      (k: AkisKart) => k.tur !== tur,
      (k: AkisKart) => k.etiketler[0] !== konu,
    ];
    let i = 0;
    if (tur || konu) {
      for (const ok of adaylar) {
        const j = kalan.findIndex(ok);
        if (j !== -1) {
          i = j;
          break;
        }
      }
    }
    sonuc.push(...kalan.splice(i, 1));
  }
  return sonuc;
}

export function kartlariSec(kartlar: AkisKart[], secim: AkisSecim, ilerleme: Ilerleme): AkisKart[] {
  const turOk = (k: AkisKart) => secim.turler.length === 0 || secim.turler.includes(k.tur);
  const havuz = kartlar.filter((k) => k.ders === secim.ders && kapsamaUyar(k, secim.kapsam) && turOk(k));
  let sirali: AkisKart[];
  if (secim.kapsam.tip === "genel") {
    const oranlar = etiketOranlari(kartlar.filter((k) => k.ders === secim.ders), ilerleme);
    const puan = new Map(havuz.map((k) => [k.id, akisPuani(k, ilerleme, oranlar)]));
    sirali = turleriKaristir([...havuz].sort((a, b) => (puan.get(b.id) ?? 0) - (puan.get(a.id) ?? 0) || a.id.localeCompare(b.id)));
  } else {
    sirali = [...havuz].sort(
      (a, b) => ZORLUK[a.tur] - ZORLUK[b.tur] || (a.satirlar?.[0] ?? 0) - (b.satirlar?.[0] ?? 0) || a.id.localeCompare(b.id),
    );
  }
  return sirali.slice(0, Math.max(1, secim.adet));
}

export interface KapsamSecenekleri {
  genel: number;
  notlar: { hafta: number; adet: number }[];
  odevHaftalari: { hafta: number; adet: number }[];
  odevler: { odev: string; hafta: number; adet: number }[];
}

export function kapsamSecenekleri(kartlar: AkisKart[], ders: AkisDers): KapsamSecenekleri {
  const n = new Map<number, number>();
  const oh = new Map<number, number>();
  const o = new Map<string, { hafta: number; adet: number }>();
  let genel = 0;
  for (const k of kartlar) {
    if (k.ders !== ders) continue;
    genel++;
    if (k.odev) {
      oh.set(k.hafta, (oh.get(k.hafta) ?? 0) + 1);
      o.set(k.odev, { hafta: k.hafta, adet: (o.get(k.odev)?.adet ?? 0) + 1 });
    } else n.set(k.hafta, (n.get(k.hafta) ?? 0) + 1);
  }
  const sayi = (m: Map<number, number>) => [...m].map(([hafta, adet]) => ({ hafta, adet })).sort((a, b) => a.hafta - b.hafta);
  return {
    genel,
    notlar: sayi(n),
    odevHaftalari: sayi(oh),
    odevler: [...o].map(([odev, v]) => ({ odev, ...v })).sort((a, b) => a.hafta - b.hafta || a.odev.localeCompare(b.odev, "tr", { numeric: true })),
  };
}

// Şıkları her kartta aynı yere koymamak için deterministik karıştırma (FNV-1a + mulberry32).
export function secenekSirasi(id: string, n: number, tohum = 0): number[] {
  let h = 2166136261 ^ tohum;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let a = h >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sira = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [sira[i], sira[j]] = [sira[j], sira[i]];
  }
  return sira;
}

export function ilerlemeKaydet(ilerleme: Ilerleme, id: string, dogruMu: boolean): Ilerleme {
  const p = ilerleme[id] ?? { d: 0, y: 0, son: null };
  return { ...ilerleme, [id]: { d: p.d + (dogruMu ? 1 : 0), y: p.y + (dogruMu ? 0 : 1), son: dogruMu ? "d" : "y" } };
}

export function etiketZayifligi(kartlar: AkisKart[], ilerleme: Ilerleme) {
  const t = new Map<string, { d: number; y: number }>();
  for (const k of kartlar) {
    const p = ilerleme[k.id];
    if (!p) continue;
    for (const e of k.etiketler) {
      const v = t.get(e) ?? { d: 0, y: 0 };
      t.set(e, { d: v.d + p.d, y: v.y + p.y });
    }
  }
  return [...t]
    .map(([etiket, v]) => ({ etiket, ...v }))
    .filter((v) => v.y > 0)
    .sort((a, b) => b.y / (b.d + b.y) - a.y / (a.d + a.y) || b.y - a.y || a.etiket.localeCompare(b.etiket));
}
