import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types uzantı ister
import * as svgModulu from "./svg-guvenli.ts";
// @ts-expect-error Node strip-types uzantı ister
import { kartlariAyikla, kartTipiMi, kartUretPromptu } from "./kart-uret.ts";

test("kartlariAyikla: kısa, boş ve tekrar eden kartlar reddedilir", () => {
  const r = kartlariAyikla([
    { prompt: "Konvolüsyon çekirdeği ne yapar?", answer: "Komşulara ağırlık verir.", hint: "Kaydırılan pencere" },
    { prompt: "konvolüsyon çekirdeği ne yapar?", answer: "tekrar" },
    { prompt: "kısa", answer: "x" },
    { prompt: "Cevapsız soru metni burada", answer: "" },
    null,
  ]);
  assert.equal(r.kartlar.length, 1);
  assert.equal(r.reddedilen, 4);
  assert.equal(r.kartlar[0].hint, "Kaydırılan pencere");
});

test("kartlariAyikla: sınır ve null girdi", () => {
  const cok = Array.from({ length: 20 }, (_, i) => ({ prompt: `Soru numarası ${i} nedir açıkla`, answer: "cevap" }));
  assert.equal(kartlariAyikla(cok, 3).kartlar.length, 3);
  assert.deepEqual(kartlariAyikla(null), { kartlar: [], reddedilen: 0 });
});

test("kartUretPromptu: ders, tür, istek ve tekrar listesi istemde yer alır", () => {
  const p = kartUretPromptu({
    ders: { kod: "EBLG351", baslik: "Görüntü İşleme" },
    uniteler: ["Filtreler"],
    mevcut: ["Eski soru bir"],
    istek: "kenar bulma",
    tip: "tuzakli",
    adet: 4,
  });
  for (const s of ["EBLG351", "Filtreler", "Eski soru bir", "kenar bulma", "Tuzaklı", "4 adet"]) assert.ok(p.includes(s), s);
  assert.equal(kartTipiMi("hesap"), true);
  assert.equal(kartTipiMi("x"), false);
});

test("kartlariAyikla: uygun svg alınır, tehlikeli svg düşer", () => {
  const iyi = "<svg viewBox='0 0 320 180'><path d='M10 10 L100 10' stroke='currentColor' fill='none'/><text x='5' y='5'>A</text></svg>";
  const r = kartlariAyikla([
    { prompt: "OR kapısının şemasını çiz", answer: "Y = A + B", svg: iyi },
    { prompt: "AND kapısının şemasını çiz", answer: "Y = A . B", svg: "<svg viewBox='0 0 9 9'><script>alert(1)</script></svg>" + " ".repeat(40) },
  ]);
  assert.equal(r.kartlar[0].svg, iyi);
  assert.equal(r.kartlar[1].svg, null);
});

test("svgAyir / svgUygunMu", () => {
  const { svgAyir, svgUygunMu } = svgModulu;
  const a = svgAyir("Metin\n\n```svg\n<svg viewBox='0 0 1 1'></svg>\n```");
  assert.equal(a.metin, "Metin");
  assert.equal(a.svg, "<svg viewBox='0 0 1 1'></svg>");
  assert.equal(svgAyir("düz metin").svg, null);
  assert.equal(svgUygunMu("<svg onload='x()' viewBox='0 0 9 9'>" + "a".repeat(40) + "</svg>"), false);
});

test("asciiSemaTemizle: kutu çizimi satırları atılır, formül kalır", () => {
  const a = "A ─┐\n├─[OR]── Y\nB ─┘\n$Y = A + B$";
  assert.equal(svgModulu.svgAyir(a).metin, "$Y = A + B$");
  assert.equal(svgModulu.svgAyir("Düz cevap\nikinci").metin, "Düz cevap\nikinci");
});
