"use client";

import React, { useMemo } from "react";
import { svgTemizle } from "@/lib/svg-guvenli";

// Temizlenmiş SVG'yi renk uyumlu bir çerçevede gösterir; geçersizse hiçbir şey çizmez.
export function SvgSekil({ svg, etiket = "Çözüm şeması" }: { svg: string; etiket?: string }) {
  const temiz = useMemo(() => svgTemizle(svg), [svg]);
  if (!temiz) return null;
  return (
    <figure className="svg-sekil" aria-label={etiket}>
      <div dangerouslySetInnerHTML={{ __html: temiz }} />
    </figure>
  );
}
