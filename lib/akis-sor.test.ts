import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
import { akisSorBaglami } from "./akis-sor.ts";

const kart = {
  id: "k1", tur: "kod-oku", ders: "EBLG351", hafta: 4, odev: "h4-1", dosya: "a.py", satirlar: [1, 2], etiketler: ["x"],
  soru: "Ne yapar?", aciklama: "GIZLI-ACIKLAMA", secenekler: ["alfa", "SAKLI-DOGRU", "gama"], dogru: 1,
} as never;

test("cevaplanmamış kartta doğru şık ve açıklama bağlama girmez, ipucu kuralı vardır", () => {
  const b = akisSorBaglami(kart, ["x = 1"], null);
  const hepsi = JSON.stringify(b);
  assert.ok(!hepsi.includes("GIZLI-ACIKLAMA"));
  assert.ok(!b.explanation.includes("DOĞRU CEVAP"));
  assert.ok(b.explanation.includes("HENÜZ cevaplamadı"));
  assert.ok(b.source.includes("x = 1") && b.source.includes("Ne yapar?") && b.source.includes("k1"));
});

test("cevaplanınca doğru cevap, açıklama ve öğrencinin seçimi eklenir", () => {
  const b = akisSorBaglami(kart, ["x = 1"], { secim: { tip: "sik", index: 0 }, outcome: "incorrect" });
  assert.ok(b.explanation.includes("GIZLI-ACIKLAMA"));
  assert.ok(b.explanation.includes("DOĞRU CEVAP (kart paketinden, kesin; değiştirme): SAKLI-DOGRU"));
  assert.ok(b.explanation.includes("Öğrencinin cevabı: alfa (yanlış)"));
});
