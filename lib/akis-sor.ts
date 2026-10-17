// "Bu karta sor" bağlamı: sunucu kartı paketten okur, doğru cevabı yalnız kullanıcı cevapladıktan sonra ekler. Saf modül.
import type { AkisKart } from "./akis-paket";
import type { Secim } from "./akis-olay";

export interface AkisCevabi {
  secim: Secim;
  outcome: "correct" | "incorrect";
}

export function dogruMetni(k: AkisKart): string {
  switch (k.tur) {
    case "hata-bul": return `${k.hataSatir}. satır`;
    case "sinav": return k.dogruMu ? "Doğru" : "Yanlış";
    case "odev": return k.adimlar.join(" → ");
    case "acikla": return "";
    default: return k.secenekler[k.dogru];
  }
}

export function secimMetni(k: AkisKart, s: Secim): string {
  switch (s.tip) {
    case "sik": return "secenekler" in k ? (k.secenekler[s.index] ?? "") : "";
    case "satir": return `${s.n}. satır`;
    case "dogruMu": return s.deger ? "Doğru" : "Yanlış";
    case "sira": return s.sira.map((i) => (k.tur === "odev" ? (k.adimlar[i] ?? "") : "")).join(" → ");
    case "kendi": return s.anladim ? "Anladım" : "Tekrar";
  }
}

const GIZLI_KURAL =
  "Öğrenci bu kartı HENÜZ cevaplamadı. Doğru cevabı, hangi şıkkın doğru olduğunu veya hata satırını ASLA söyleme ve ima etme; " +
  "yalnız kısa ipucu ver, kodun hangi kısmına bakması gerektiğini yönlendir.";

// Kademeli ipucu: cevap yok. 1 yön, 2 ilk adım, 3 benzer örnek.
export function ipucuMesaji(seviye: 1 | 2 | 3): string {
  if (seviye === 1) return "İpucu 1/3 (yön): Kodun hangi kısmına ve hangi kavrama bakmalıyım? Cevabı veya şıkları eleme yapma.";
  if (seviye === 2) return "İpucu 2/3 (ilk adım): Bu soruyu çözmek için atmam gereken ilk adımı söyle. Cevabı verme.";
  return "İpucu 3/3 (benzer örnek): Aynı mantığı gösteren, farklı değerli küçük bir benzer örnek çöz. Bu kartın cevabını verme.";
}

export function akisSorBaglami(k: AkisKart, kod: string[], cevap: AkisCevabi | null) {
  const sikler = "secenekler" in k ? `\nŞıklar: ${k.secenekler.map((s, i) => `${i + 1}) ${s}`).join(" | ")}` : "";
  const adimlar = k.tur === "odev" ? `\nAdımlar (karışık): ${k.adimlar.join(" | ")}` : "";
  const kunye = `Kart: ${k.id} · tür ${k.tur} · ${k.ders} · hafta ${k.hafta}${k.odev ? ` · ödev ${k.odev}` : ""}`;
  const degisiklik = k.tur === "ne-olur" ? `\nDeğişiklik: ${k.degisiklik.eski} → ${k.degisiklik.yeni}` : "";
  let explanation: string;
  if (!cevap) {
    explanation = GIZLI_KURAL;
  } else {
    const dogru = dogruMetni(k);
    const verilen = secimMetni(k, cevap.secim);
    explanation =
      `${k.aciklama}` +
      ("kanit" in k ? `\nKanıt (gerçek çalıştırma çıktısı): ${k.kanit}` : "") +
      (dogru ? `\nDOĞRU CEVAP (kart paketinden, kesin; değiştirme): ${dogru}` : "") +
      (verilen ? `\nÖğrencinin cevabı: ${verilen} (${cevap.outcome === "correct" ? "doğru" : "yanlış"})` : "") +
      "\nÖğrenci cevapladı: neden doğru/yanlış olduğunu bu bilgilere dayanarak açıkla; kartta olmayan yeni cevap uydurma.";
  }
  return {
    kind: "akis-kart",
    file: k.dosya,
    startLine: k.satirlar?.[0],
    endLine: k.satirlar?.[1],
    source: `${kunye}\n\n${kod.join("\n")}\n\nKart sorusu: ${k.soru}${degisiklik}${sikler}${adimlar}`.slice(0, 19000),
    explanation,
  };
}
