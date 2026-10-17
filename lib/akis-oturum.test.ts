import test from "node:test";
import assert from "node:assert/strict";
import {
  akisPuani, etiketOranlari, etiketZayifligi, ilerlemeKaydet, kapsamSecenekleri, kartlariSec, secenekSirasi, turleriKaristir,
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
} from "./akis-oturum.ts";

const kart = (id: string, tur: string, o: Record<string, unknown> = {}) => ({
  id, tur, ders: "EBLG351", hafta: 4, odev: "h4-1", dosya: "a.py", satirlar: [1, 2], etiketler: ["x"], ...o,
}) as never;

test("secenekSirasi: deterministik permütasyon, tohum sırayı değiştirir", () => {
  const a = secenekSirasi("k1", 5);
  assert.deepEqual(a, secenekSirasi("k1", 5));
  assert.deepEqual([...a].sort(), [0, 1, 2, 3, 4]);
  const farkli = [1, 2, 3, 4, 5, 6].some((t) => secenekSirasi("k1", 5, t).join() !== a.join());
  assert.ok(farkli);
});

test("turleriKaristir: art arda üç aynı tür kalmaz", () => {
  const l = ["a", "b", "c", "d"].map((i) => kart(i, "kod-oku")).concat([kart("e", "sinav")]);
  const s = turleriKaristir(l) as { id: string; tur: string }[];
  for (let i = 2; i < s.length; i++) assert.ok(!(s[i].tur === s[i - 1].tur && s[i].tur === s[i - 2].tur));
  assert.equal(s.length, 5);
});

test("turleriKaristir: aynı ana konudan art arda en fazla iki kart", () => {
  const l = ["a", "b", "c", "d"].map((i, n) => kart(i, n % 2 ? "sinav" : "kod-oku", { etiketler: ["x"] })).concat(
    ["e", "f"].map((i, n) => kart(i, n % 2 ? "sinav" : "kod-oku", { etiketler: ["y"] }))
  );
  const s = turleriKaristir(l) as { etiketler: string[] }[];
  for (let i = 2; i < s.length; i++) assert.ok(!(s[i].etiketler[0] === s[i - 1].etiketler[0] && s[i].etiketler[0] === s[i - 2].etiketler[0]));
  assert.equal(s.length, 6);
});

test("kartlariSec: ödev kapsamında kolay->zor, tür filtresi, adet sınırı", () => {
  const k = [kart("z", "acikla"), kart("y", "sinav"), kart("x", "kod-oku"), kart("w", "sinav", { hafta: 5 })];
  const s = kartlariSec(k, { ders: "EBLG351", kapsam: { tip: "odev", hafta: 4 }, turler: [], adet: 20 }, {}) as { id: string }[];
  assert.deepEqual(s.map((c) => c.id), ["y", "x", "z"]);
  const t = kartlariSec(k, { ders: "EBLG351", kapsam: { tip: "genel" }, turler: ["sinav"], adet: 1 }, {});
  assert.equal(t.length, 1);
});

test("kapsamaUyar: not kartı ödev kapsamına, ödev kartı not kapsamına girmez", () => {
  const k = [
    kart("n1", "sinav", { odev: undefined, dosya: undefined, satirlar: undefined, kod: "x=1" }),
    kart("o1", "sinav", { odev: "h4-1" }),
    kart("o2", "sinav", { odev: "h4-2" }),
  ];
  const sec = (kapsam: unknown) =>
    (kartlariSec(k, { ders: "EBLG351", kapsam, turler: [], adet: 20 } as never, {}) as { id: string }[]).map((c) => c.id).sort();
  assert.deepEqual(sec({ tip: "not", hafta: 4 }), ["n1"]);
  assert.deepEqual(sec({ tip: "odev", hafta: 4 }), ["o1", "o2"]);
  assert.deepEqual(sec({ tip: "odev", hafta: 4, odev: "h4-2" }), ["o2"]);
  assert.deepEqual(sec({ tip: "not", hafta: 5 }), []);
});

test("kartlariSec: genel tekrarda yanlış yapılan öne, ustalaşılan sona", () => {
  const k = [kart("a", "sinav"), kart("b", "kod-oku"), kart("c", "acikla")];
  let il = ilerlemeKaydet({}, "a", true);
  il = ilerlemeKaydet(il, "b", false);
  const s = kartlariSec(k, { ders: "EBLG351", kapsam: { tip: "genel" }, turler: [], adet: 9 }, il) as { id: string }[];
  assert.deepEqual(s.map((c) => c.id), ["b", "c", "a"]);
});

test("ilerlemeKaydet girdiyi değiştirmez; etiketZayifligi yanlış oranına göre", () => {
  const taban = {};
  const il = ilerlemeKaydet(taban, "a", false);
  assert.deepEqual(taban, {});
  assert.deepEqual(il.a, { d: 0, y: 1, son: "y" });
  const k = [kart("a", "sinav", { etiketler: ["sobel"] }), kart("b", "sinav", { etiketler: ["canny"] })];
  const z = etiketZayifligi(k, ilerlemeKaydet(ilerlemeKaydet(il, "b", true), "b", false));
  assert.equal(z[0].etiket, "sobel");
});

test("kapsamSecenekleri not ve ödevi ayırır", () => {
  const o = kapsamSecenekleri([kart("a", "sinav", { odev: undefined, dosya: undefined, satirlar: undefined, kod: "x" }), kart("b", "sinav"), kart("c", "sinav", { odev: "h4-2" })], "EBLG351");
  assert.equal(o.genel, 3);
  assert.deepEqual(o.notlar, [{ hafta: 4, adet: 1 }]);
  assert.deepEqual(o.odevHaftalari, [{ hafta: 4, adet: 2 }]);
  assert.deepEqual(o.odevler.map((x: { odev: string }) => x.odev), ["h4-1", "h4-2"]);
});

test("akisPuani: vade zayıflıktan, zayıflık yeniden, yeni tercihten önce", () => {
  const a = kart("a", "sinav", { etiketler: ["a"] }); // vadesi gelmiş, doğru
  const b = kart("b", "sinav", { etiketler: ["b"] }); // 3 yanlış
  const c = kart("c", "sinav", { etiketler: ["c"] }); // yeni
  const il = { a: { d: 2, y: 0, son: "d", due: true }, b: { d: 0, y: 3, son: "y" } } as never;
  const o = etiketOranlari([a, b, c], il);
  const p = (k: never) => akisPuani(k, il, o);
  assert.ok(p(a) > p(b));
  assert.ok(p(b) > p(c));
  const tercihli = { c: { d: 0, y: 0, son: null, tercih: "dislike" } } as never;
  assert.ok(akisPuani(c, tercihli, new Map()) < akisPuani(c, {} as never, new Map()));
});

test("kartlariSec: genel tekrarda zayıf etikete sahip yeni kart öne gelir", () => {
  const k = [
    kart("a", "sinav", { etiketler: ["sobel"] }),
    kart("y1", "kod-oku", { etiketler: ["canny"] }),
    kart("y2", "acikla", { etiketler: ["sobel"] }), // yeni ama zayıf etiket
    kart("y3", "ne-olur", { etiketler: ["gurultu"] }),
  ];
  const il = ilerlemeKaydet(ilerlemeKaydet({}, "a", false), "a", false);
  const s = kartlariSec(k, { ders: "EBLG351", kapsam: { tip: "genel" }, turler: [], adet: 9 }, il) as { id: string }[];
  const sira = s.map((c) => c.id);
  assert.ok(sira.indexOf("y2") < sira.indexOf("y1") && sira.indexOf("y2") < sira.indexOf("y3"));
});
