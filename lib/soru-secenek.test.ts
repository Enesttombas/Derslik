import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
import { adimlar, ipucuMerdiveni, kisaCevap, secenekUret, type SoruKarti } from "./soru-secenek.ts";

const kart = (id: string, answer: string, hint: string | null = null, courseId = "c1"): SoruKarti => ({ id, courseId, prompt: "?", answer, hint });

test("kisaCevap: Cevap kalıbı ve uzun metin", () => {
  assert.equal(kisaCevap("Sağdan 4'erli: 0011 0111 0110 → 3, 7, 6. Cevap: (376)16."), "(376)16");
  assert.equal(kisaCevap("O(n log n)"), "O(n log n)");
  assert.equal(kisaCevap("a. Cevap: $(0011\\ 1100)_2 = (1111000111)_2$ (baştaki sıfırlar atılabilir)."), "$(1111000111)_2$");
  assert.equal(kisaCevap("r1) → 0. Sondan başa: $(1001101)_2$. Doğrulama: $64 + 8 + 4 + 1 = 77$."), "$(1001101)_2$");
  assert.equal(kisaCevap("x".repeat(200)), null);
  assert.equal(kisaCevap("satır bir\nsatır iki"), null);
});

test("adimlar: satır ve cümle bölme, tek adım boş", () => {
  assert.deepEqual(adimlar("1. önce a\n2. sonra b\n3. cevap c"), ["önce a", "sonra b", "cevap c"]);
  assert.deepEqual(adimlar("Önce a yap. Sonra b yap."), ["Önce a yap.", "Sonra b yap."]);
  assert.deepEqual(adimlar("tek cümle"), []);
});

test("ipucuMerdiveni: ipucu + son adım hariç", () => {
  assert.deepEqual(ipucuMerdiveni({ answer: "a1. b2. c3.", hint: "ipucu" }), ["ipucu", "a1.", "b2."]);
  assert.deepEqual(ipucuMerdiveni({ answer: "tek", hint: null }), []);
});

test("secenekUret: doğru şık var, tekil, deterministik, yetersizse null", () => {
  const havuz = [kart("a", "O(n)"), kart("b", "O(n^2)"), kart("c", "O(log n)"), kart("d", "O(1)"), kart("e", "O(n log n)")];
  const s = secenekUret(havuz[0], havuz)!;
  assert.equal(s.secenekler.length, 5);
  assert.equal(s.secenekler[s.dogru], "O(n)");
  assert.equal(new Set(s.secenekler).size, 5);
  assert.deepEqual(secenekUret(havuz[0], havuz), s);
  assert.equal(secenekUret(havuz[0], [havuz[0], havuz[1]]), null);
  assert.equal(secenekUret(kart("z", "x".repeat(200)), havuz), null);
});
