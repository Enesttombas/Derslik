// Sorular modu: kart cevabından A–E şıkları, kademeli ipucu ve adım listesi üretir.
// Saf modül; şıklar uydurulmaz — çeldiriciler aynı oturumdaki diğer kartların kısa cevaplarıdır.

export interface SoruKarti {
  id: string;
  courseId: string;
  prompt: string;
  answer: string;
  hint: string | null;
}

const KISA_SINIR = 60;

const temizle = (s: string) => s.replace(/\s+/g, " ").replace(/\*\*|`/g, "").trim();

/** Şık olabilecek kısa cevap; çıkmazsa null. "Cevap: X." kalıbı önceliklidir. */
export function kisaCevap(answer: string): string | null {
  const t = answer.trim();
  const m =
    t.match(/Cevap\s*[:：]\s*([^\n]+?)\.?\s*$/i) ??
    t.match(/(?:Sonuç|Sondan başa)\s*[:：]\s*([\s\S]+?)\.\s*(?:Doğrulama\b[\s\S]*)?$/i);
  // "= … (baştaki sıfırlar atılabilir)" gibi sondaki açıklama parantezini at
  let aday = temizle(m ? m[1] : t).replace(/\s*\([^()$]*[a-zçğıöşü]{4,}[^()$]*\)\s*$/i, "");
  // "A = B" biçiminde dönüşüm zinciri: şık olarak son sonuç (B) yeter
  if (m && aday.includes("=")) {
    const son = aday.slice(aday.lastIndexOf("=") + 1).replace(/[\s$]+$/, "").trim();
    if (son) aday = aday.includes("$") ? `$${son}$` : son;
  }
  const cekirdek = aday.replace(/[$\\\s]/g, "");
  if (!aday || cekirdek.length > KISA_SINIR || (!m && /\n/.test(t))) return null;
  return aday;
}

/** Cevabı öğretici adımlara böler (satır, yoksa cümle). 2'den az adım varsa boş. */
export function adimlar(answer: string): string[] {
  const satirlar = answer.split(/\r?\n/).map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter(Boolean);
  const parcalar = satirlar.length >= 2 ? satirlar : (satirlar[0] ?? "").split(/(?<=[.!?])\s+(?=\S)/).map((s) => s.trim()).filter(Boolean);
  return parcalar.length >= 2 ? parcalar : [];
}

/** İpucu merdiveni: önce yazılı ipucu, sonra son adım hariç adımlar (son adım cevabı verir). */
export function ipucuMerdiveni(k: Pick<SoruKarti, "answer" | "hint">): string[] {
  const a = adimlar(k.answer);
  return [...(k.hint ? [k.hint] : []), ...a.slice(0, Math.max(0, a.length - 1))];
}

function tohumla(s: string): () => number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sayisal = (s: string) => {
  const t = s.replace(/[$\\_{}^]|\\(?:text|mathrm)/g, "");
  return /^[\s\-+()0-9.,:/a-fA-F]*$/.test(t) && /\d/.test(t);
};

export interface Secenekler {
  secenekler: string[];
  dogru: number;
}

/** Kısa cevabı olan karta en fazla 5 şık (A–E). En az 3 şık çıkmazsa null. */
export function secenekUret(kart: SoruKarti, havuz: SoruKarti[], adet = 5): Secenekler | null {
  const dogru = kisaCevap(kart.answer);
  if (!dogru) return null;
  const gorulen = new Set([dogru.toLowerCase()]);
  const adaylar: { metin: string; ayni: number }[] = [];
  for (const k of havuz) {
    if (k.id === kart.id) continue;
    const m = kisaCevap(k.answer);
    if (!m || gorulen.has(m.toLowerCase())) continue;
    // sayısal cevaba metin, metne sayı çeldirici verme; boyu çok farklı olanı alma
    if (sayisal(m) !== sayisal(dogru) || m.length > dogru.length * 3 + 12 || dogru.length > m.length * 3 + 12) continue;
    gorulen.add(m.toLowerCase());
    // aynı ders ve aynı tür (sayısal/metin) çeldirici öne
    adaylar.push({ metin: m, ayni: (k.courseId === kart.courseId ? 0 : 2) + (sayisal(m) === sayisal(dogru) ? 0 : 1) });
  }
  const rastgele = tohumla(kart.id);
  adaylar.sort((a, b) => a.ayni - b.ayni || rastgele() - 0.5);
  const secilen = adaylar.slice(0, adet - 1).map((a) => a.metin);
  if (secilen.length < 2) return null;
  const hepsi = [dogru, ...secilen];
  for (let i = hepsi.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [hepsi[i], hepsi[j]] = [hepsi[j], hepsi[i]];
  }
  return { secenekler: hepsi, dogru: hepsi.indexOf(dogru) };
}
