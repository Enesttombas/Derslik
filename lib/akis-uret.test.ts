import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
import { jsonDizisiAyikla, sseMetni, uretKartiMi, uretKartlariniKur, uretPromptu } from "./akis-uret.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test için basit doğrulayıcı: şema kuralları (dogru aralığı, benzersiz şık) elle taklit edilir.
const dogrula = (aday: unknown): never => {
  const k = aday as Record<string, any>;
  const ok = Array.isArray(k.secenekler) && new Set(k.secenekler).size === k.secenekler.length && k.dogru < k.secenekler.length && typeof k.soru === "string";
  return (ok ? { success: true, data: k } : { success: false }) as never;
};

const gecerli = { soru: "Ne yazdırır?", kod: "x = 1\nprint(x)", secenekler: ["0", "1", "2", "3"], dogru: 1, aciklama: "x 1.", etiketler: ["print"] };

test("jsonDizisiAyikla: kod çiti ve önsözü atar, bozuk girdide null", () => {
  assert.deepEqual(jsonDizisiAyikla('Tamam:\n```json\n[{"a":1}]\n```'), [{ a: 1 }]);
  assert.equal(jsonDizisiAyikla("dizi yok"), null);
  assert.equal(jsonDizisiAyikla("[bozuk"), null);
});

test("uretKartlariniKur: geçerli kart kurulur, bozuk olanlar sayılır, kimlik önekli", () => {
  let n = 0;
  const metin = JSON.stringify([gecerli, { ...gecerli, dogru: 9 }, { ...gecerli, secenekler: ["a", "a", "b", "c"] }, "çöp"]);
  const r = uretKartlariniKur(metin, { ders: "EBLG351", hafta: 4 }, () => `k${++n}`, dogrula);
  assert.equal(r.kartlar.length, 1);
  assert.equal(r.reddedilen, 3);
  assert.equal(r.kartlar[0].id, "uret-k1");
  assert.equal(r.kartlar[0].tur, "kod-oku");
  assert.ok(uretKartiMi(r.kartlar[0].id));
});

test("uretKartlariniKur: tek istekte en fazla 5 kart işlenir", () => {
  const r = uretKartlariniKur(JSON.stringify(Array.from({ length: 9 }, () => gecerli)), { ders: "EBLG359", hafta: 2 }, () => Math.random().toString(36).slice(2), dogrula);
  assert.equal(r.kartlar.length, 5);
});

test("sseMetni: delta parçalarını birleştirir", () => {
  assert.equal(sseMetni('data: {"delta":"a"}\n\ndata: {"delta":"b"}\n\ndata: [DONE]\n\n'), "ab");
});

test("uretPromptu: istek, ders ve örnek konu istemde yer alır", () => {
  const p = uretPromptu({ istek: "döngüler", ders: "EBLG351", hafta: 4, adet: 3, ornek: { soru: "S?", etiketler: ["for"] } });
  assert.ok(p.includes("döngüler") && p.includes("EBLG351") && p.includes("for") && p.includes("3 adet"));
});
