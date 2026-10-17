// Kart cevaplarındaki ```svg çitli şemaları ayırır ve tarayıcıda güvenli biçimde temizler.
// Beyaz liste: yalnız çizim etiketleri ve çizim öznitelikleri; script, olay, harici bağlantı ve stil yok.

const SVG_CITI = /```svg[ \t]*\r?\n([\s\S]*?)```/i;
export const SVG_AZAMI_UZUNLUK = 8000;

// Kutu çizim karakterleri ve [AND] tarzı metin şemaları: ders notu üslubuna uymaz, gösterimden atılır.
const ASCII_SEMA_SATIRI = /[├└┌┐┘│┤┬┴┼─╭╮╯╰]|\[(?:AND|OR|NOT|NAND|NOR|XOR|XNOR)\]/;

export function asciiSemaTemizle(metin: string): string {
  const satirlar = metin.split(/\r?\n/);
  const kalan = satirlar.filter((s) => !ASCII_SEMA_SATIRI.test(s));
  return kalan.length === satirlar.length || kalan.length === 0 ? metin : kalan.join("\n");
}

export function svgAyir(cevap: string): { metin: string; svg: string | null } {
  const m = SVG_CITI.exec(cevap);
  const metin = asciiSemaTemizle(m ? cevap.replace(SVG_CITI, "").trim() : cevap);
  return { metin, svg: m ? m[1].trim() : null };
}

/** Model çıktısından ilk <svg>…</svg> bloğunu çıkarır (kod çiti ya da düz metin olabilir). */
export function svgBul(metin: string): string | null {
  const m = /<svg[\s\S]*?<\/svg>/i.exec(metin);
  return m ? m[0] : null;
}

const ETIKETLER = new Set([
  "svg", "g", "path", "line", "polyline", "polygon", "rect", "circle", "ellipse", "text", "tspan",
  "defs", "marker", "title", "desc", "lineargradient", "radialgradient", "stop",
]);
const OZNITELIKLER = new Set([
  "viewbox", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "d", "points",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity",
  "fill-opacity", "stroke-opacity", "transform", "text-anchor", "dominant-baseline", "font-size", "font-weight",
  "font-family", "font-style", "marker-end", "marker-start", "id", "offset", "stop-color", "stop-opacity",
  "markerwidth", "markerheight", "refx", "refy", "orient", "markerunits", "preserveaspectratio", "dx", "dy",
  "gradientunits", "gradienttransform", "xmlns", "fill-rule", "clip-rule", "role", "aria-label",
]);
// url(#kimlik) dışında hiçbir url / javascript / harici başvuru geçmez.
const YASAK_DEGER = /javascript:|data:|expression\(|@import|[<>]/i;
const URL_KULLANIMI = /url\(\s*([^)]*)\)/gi;
const guvenliDeger = (v: string): boolean =>
  !YASAK_DEGER.test(v) && [...v.matchAll(URL_KULLANIMI)].every((m) => /^#[\w-]+$/.test(m[1].trim()));

function temizle(dugum: Element, sonuc: Element, belge: Document): void {
  for (const cocuk of Array.from(dugum.childNodes)) {
    if (cocuk.nodeType === 3) {
      sonuc.appendChild(belge.createTextNode(cocuk.textContent ?? ""));
    } else if (cocuk.nodeType === 1) {
      const el = cocuk as Element;
      const ad = el.localName.toLowerCase();
      if (!ETIKETLER.has(ad)) continue; // izinsiz etiket ve altı atılır
      const yeni = belge.createElementNS("http://www.w3.org/2000/svg", ad === "lineargradient" ? "linearGradient" : ad === "radialgradient" ? "radialGradient" : ad);
      for (const oz of Array.from(el.attributes)) {
        const n = oz.name.toLowerCase();
        if (!OZNITELIKLER.has(n) || !guvenliDeger(oz.value)) continue;
        yeni.setAttribute(oz.name, oz.value);
      }
      temizle(el, yeni, belge);
      sonuc.appendChild(yeni);
    }
  }
}

/** Temiz SVG metni döner; geçersiz ya da çok büyükse null. Yalnız tarayıcıda çalışır. */
export function svgTemizle(ham: string): string | null {
  if (typeof DOMParser === "undefined" || ham.length > SVG_AZAMI_UZUNLUK) return null;
  const belge = new DOMParser().parseFromString(ham, "image/svg+xml");
  const kok = belge.documentElement;
  if (!kok || kok.localName.toLowerCase() !== "svg" || belge.getElementsByTagName("parsererror").length > 0) return null;
  const cikti = belge.implementation.createDocument("http://www.w3.org/2000/svg", "svg", null);
  const yeniKok = cikti.documentElement;
  for (const oz of Array.from(kok.attributes)) {
    const n = oz.name.toLowerCase();
    if (OZNITELIKLER.has(n) && n !== "width" && n !== "height" && guvenliDeger(oz.value)) yeniKok.setAttribute(oz.name, oz.value);
  }
  if (!yeniKok.getAttribute("viewBox")) return null;
  yeniKok.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  yeniKok.setAttribute("role", "img");
  temizle(kok, yeniKok, cikti);
  if (yeniKok.childNodes.length === 0) return null;
  return new XMLSerializer().serializeToString(yeniKok);
}

/** Üretim tarafı (sunucu): SVG'nin kabaca geçerli olup olmadığını denetler. */
export function svgUygunMu(svg: unknown): svg is string {
  return (
    typeof svg === "string" &&
    svg.length >= 40 &&
    svg.length <= SVG_AZAMI_UZUNLUK &&
    /^\s*<svg[\s>]/i.test(svg) &&
    /<\/svg>\s*$/i.test(svg) &&
    /viewBox\s*=/.test(svg) &&
    !/<script|javascript:|\son\w+\s*=|<foreignObject|<image|<use|<style|href\s*=/i.test(svg)
  );
}
