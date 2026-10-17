import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
import { gecTekrarHesapla, degerlendir, pakCevapSchema, pakKartId, pakKimligi } from "./akis-olay.ts";

const taban = { id: "k", ders: "EBLG351", hafta: 4, etiketler: ["x"], soru: "s", aciklama: "a" };
const sik = { ...taban, tur: "kod-oku", secenekler: ["a", "b", "c"], dogru: 1 } as never;
const sec = (o: Record<string, unknown>) => o as never;

test("pak kimliği önek ekler ve söker", () => {
  assert.equal(pakKartId("351-h4-x"), "pak:351-h4-x");
  assert.equal(pakKimligi("pak:351-h4-x"), "351-h4-x");
  assert.equal(pakKimligi("cur:abc"), null);
});

test("degerlendir: şık doğru/yanlış, taşan dizin ve tür uyuşmazlığı", () => {
  assert.deepEqual(degerlendir(sik, sec({ tip: "sik", index: 1 })), { ok: true, outcome: "correct" });
  assert.deepEqual(degerlendir(sik, sec({ tip: "sik", index: 0 })), { ok: true, outcome: "incorrect" });
  assert.equal(degerlendir(sik, sec({ tip: "sik", index: 3 })).ok, false);
  assert.equal(degerlendir(sik, sec({ tip: "satir", n: 1 })).ok, false);
});

test("degerlendir: hata-bul, sinav, odev, acikla", () => {
  const hata = { ...taban, tur: "hata-bul", kod: "a\nb\nc", hataSatir: 2 } as never;
  assert.equal((degerlendir(hata, sec({ tip: "satir", n: 2 })) as { outcome: string }).outcome, "correct");
  assert.equal((degerlendir(hata, sec({ tip: "satir", n: 3 })) as { outcome: string }).outcome, "incorrect");

  const sinav = { ...taban, tur: "sinav", dogruMu: false } as never;
  assert.equal((degerlendir(sinav, sec({ tip: "dogruMu", deger: false })) as { outcome: string }).outcome, "correct");
  assert.equal((degerlendir(sinav, sec({ tip: "dogruMu", deger: true })) as { outcome: string }).outcome, "incorrect");

  const odev = { ...taban, tur: "odev", adimlar: ["a", "b", "c"] } as never;
  assert.equal((degerlendir(odev, sec({ tip: "sira", sira: [0, 1, 2] })) as { outcome: string }).outcome, "correct");
  assert.equal((degerlendir(odev, sec({ tip: "sira", sira: [0, 2] })) as { outcome: string }).outcome, "incorrect");
  assert.equal((degerlendir(odev, sec({ tip: "sira", sira: [0, 1] })) as { outcome: string }).outcome, "incorrect"); // yarım sıra doğru sayılmaz

  const acikla = { ...taban, tur: "acikla" } as never;
  assert.equal((degerlendir(acikla, sec({ tip: "kendi", anladim: true })) as { outcome: string }).outcome, "correct");
  assert.equal((degerlendir(acikla, sec({ tip: "kendi", anladim: false })) as { outcome: string }).outcome, "incorrect");
});

test("pakCevapSchema: istemci outcome gönderemez, fazla alan reddedilir", () => {
  const temel = { eventId: "e1", cardId: "pak:k", kind: "answer", mode: "practice", secim: { tip: "sik", index: 0 } };
  assert.ok(pakCevapSchema.safeParse(temel).success);
  assert.ok(!pakCevapSchema.safeParse({ ...temel, outcome: "correct" }).success);
  assert.ok(!pakCevapSchema.safeParse({ ...temel, secim: { tip: "sik", index: -1 } }).success);
  assert.ok(!pakCevapSchema.safeParse({ ...temel, mode: "learn" }).success);
});

test("gecTekrarHesapla: ilk cevap referans; ertesi gün ve 3. gün kovaları ayrı sayılır", () => {
  const G = 86400000;
  const r = gecTekrarHesapla([
    { kart: "a", dogru: false, t: 0 },
    { kart: "a", dogru: false, t: 1000 }, // aynı gün: sayılmaz
    { kart: "a", dogru: true, t: G + 5 },
    { kart: "a", dogru: true, t: 3 * G + 5 },
    { kart: "b", dogru: true, t: 10 },
    { kart: "b", dogru: false, t: 4 * G },
  ] as never);
  assert.deepEqual(r.ertesiGun, { dogru: 1, toplam: 1 });
  assert.deepEqual(r.ucuncuGunVeSonrasi, { dogru: 1, toplam: 2 });
});

test("pakCevapSchema: ipucu 0..3 kabul, 4 reddedilir", () => {
  const g = { eventId: "11111111-1111-4111-8111-111111111111", cardId: "pak:k", kind: "answer", mode: "practice", secim: { tip: "sik", index: 0 } };
  assert.ok(pakCevapSchema.safeParse({ ...g, ipucu: 2 }).success);
  assert.ok(!pakCevapSchema.safeParse({ ...g, ipucu: 4 }).success);
});
