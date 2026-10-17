"use client";

import type { ReactNode } from "react";
import type { KodSatiri } from "@/lib/akis-yukle";

interface Props {
  satirlar: KodSatiri[];
  /** üst çubukta gösterilen dosya adı */
  dosya?: string;
  /** hata-bul: satıra dokunulabilir */
  onSatir?: (n: number) => void;
  secili?: number | null;
  dogru?: number | null;
}

const ANAHTAR =
  "def|class|return|if|elif|else|for|while|in|import|from|as|not|and|or|is|None|True|False|lambda|with|try|except|finally|raise|pass|break|continue|yield|global";
// yorum | dize | anahtar sözcük | sayı | çağrı adı
const JETON = new RegExp(
  `(#.*$)|("""|'''|"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|\\b(${ANAHTAR})\\b|(\\b\\d+(?:\\.\\d+)?\\b)|\\b([A-Za-z_]\\w*)(?=\\()`,
  "g"
);

// Satır içi sözdizimi renklendirme (çok satırlı dizeler satır satır düz kalır).
function renkle(metin: string): ReactNode[] {
  const parcalar: ReactNode[] = [];
  let son = 0;
  let i = 0;
  for (const m of metin.matchAll(JETON)) {
    const bas = m.index ?? 0;
    if (bas > son) parcalar.push(metin.slice(son, bas));
    const sinif = m[1] ? "yorum" : m[2] ? "dize" : m[3] ? "anahtar" : m[4] ? "sayi" : "ad";
    parcalar.push(
      <span key={i++} className={`tk-${sinif}`}>
        {m[0]}
      </span>
    );
    son = bas + m[0].length;
  }
  if (son < metin.length) parcalar.push(metin.slice(son));
  return parcalar;
}

// Sarmalı kod görünümü: yatay kaydırma yok, girinti korunur. Her zaman koyu editör yüzeyi.
export function AkisKod({ satirlar, dosya, onSatir, secili, dogru }: Props) {
  if (satirlar.length === 0) return null;
  return (
    <figure className="akis-editor">
      <figcaption className="akis-editor-ust">
        <span className="akis-editor-ad">{dosya ?? "kod.py"}</span>
        {onSatir && <span className="akis-editor-ipucu">satıra dokun</span>}
      </figcaption>
      <div className="akis-kod" role={onSatir ? "listbox" : undefined}>
        {satirlar.map((s) => {
          const durum = dogru != null && s.n === dogru ? "dogru" : secili === s.n ? "yanlis" : undefined;
          const Etiket = onSatir ? "button" : "div";
          return (
            <Etiket
              key={s.n}
              type={onSatir ? "button" : undefined}
              onClick={onSatir ? () => onSatir(s.n) : undefined}
              data-durum={durum}
              className="akis-kod-satir"
            >
              <span className="akis-kod-no" aria-hidden>{s.n}</span>
              <span className="akis-kod-metin">{s.metin === "" ? " " : renkle(s.metin)}</span>
            </Etiket>
          );
        })}
      </div>
    </figure>
  );
}
