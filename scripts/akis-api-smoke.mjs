// Akış v2 API duman testi (yerel D1'e karşı çalışan worker): node scripts/akis-api-smoke.mjs [http://127.0.0.1:8795]
// Worker OWNER_EMAIL=owner@derslik.test, ALLOWED_EMAILS=friend@derslik.test ile açık olmalı; kullanıcılar başlıkla ayrılır.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:8795";
// İçerik, test edilen derlemeyle aynı olmalı: derleme kopyadan çalışıyorsa kök olarak onu ver (3. argüman).
const kok = process.argv[3] || fileURLToPath(new URL("..", import.meta.url));

const kartlar = [];
for (const d of readdirSync(join(kok, "content/akis"), { withFileTypes: true }).filter((x) => x.isDirectory())) {
  for (const f of readdirSync(join(kok, "content/akis", d.name)).filter((x) => x.endsWith(".json"))) {
    kartlar.push(...JSON.parse(readFileSync(join(kok, "content/akis", d.name, f), "utf8")).kartlar);
  }
}
// Az kartlı türde ikinci kart yoksa ilkine dön (olaylar yine ayrı eventId).
const tur = (t) => { const l = kartlar.filter((k) => k.tur === t); return [l[0], l[1] ?? l[0], l[2] ?? l[0]]; };

// Her koşu yeni kullanıcılarla başlar: önceki koşunun durumu sayaçları bozmaz.
const KOSU = randomUUID().slice(0, 8);
const OWNER = { "oai-authenticated-user-id": `smoke_owner_${KOSU}`, "oai-authenticated-user-email": "owner@derslik.test" };
const FRIEND = { "oai-authenticated-user-id": `smoke_friend_${KOSU}`, "oai-authenticated-user-email": "friend@derslik.test" };

async function istek(yol, { kimlik, govde, yontem } = {}) {
  const r = await fetch(`${BASE}${yol}`, {
    method: yontem ?? (govde ? "POST" : "GET"),
    headers: { ...(kimlik ?? {}), ...(govde ? { "Content-Type": "application/json" } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const metin = await r.text();
  let json = null;
  try { json = JSON.parse(metin); } catch { /* SSE */ }
  return { status: r.status, json, metin, basliklar: r.headers };
}
const cevap = (kimlik, kart, secim, eventId = randomUUID()) =>
  istek("/api/feed/events", { kimlik, govde: { eventId, cardId: `pak:${kart.id}`, kind: "answer", mode: "practice", secim } });
const durum = async (kimlik) => (await istek("/api/feed/akis", { kimlik })).json;
const satir = (d, kart) => d.durumlar.find((x) => x.id === kart.id);

let say = 0;
const kontrol = async (ad, fn) => {
  try {
    await fn();
    say++;
    console.log(`OK   ${ad}`);
  } catch (e) {
    console.log(`FAIL ${ad}: ${e.message}`);
    process.exitCode = 1;
    throw e;
  }
};

const sikKarti = tur("kod-oku")[0];
const sikKarti2 = tur("cikti-tahmin")[0];
const yanlisSik = (sikKarti.dogru + 1) % sikKarti.secenekler.length;

try {
  await kontrol("anonim GET reddedilir (401; yerel proxy yokken 503)", async () => {
    const g = await istek("/api/feed/akis");
    assert.ok([401, 503].includes(g.status), `GET ${g.status}`);
  });

  await kontrol("yanlış şık yanlış kaydedilir (sunucu hesaplar), GET durumu yansıtır", async () => {
    const r = await cevap(OWNER, sikKarti, { tip: "sik", index: yanlisSik });
    assert.equal(r.status, 200, r.metin);
    assert.equal(r.json.outcome, "incorrect");
    assert.equal(r.json.duplicate, false);
    const d = await durum(OWNER);
    const s = satir(d, sikKarti);
    assert.equal(s.yanlis, 1);
    assert.equal(s.dogru, 0);
    assert.equal(s.tekrar, 0);
    assert.ok(d.zayif.some((z) => sikKarti.etiketler.includes(z.etiket)), "etiket zayıflığı listelenmedi");
  });

  await kontrol("doğru şık doğru kaydedilir; SM2 tekrar 1", async () => {
    const r = await cevap(OWNER, sikKarti2, { tip: "sik", index: sikKarti2.dogru });
    assert.equal(r.json.outcome, "correct");
    const s = satir(await durum(OWNER), sikKarti2);
    assert.equal(s.dogru, 1);
    assert.equal(s.tekrar, 1);
  });

  await kontrol("aynı eventId iki kez = tek kayıt; farklı içerik 409", async () => {
    const kart = tur("kod-oku")[1];
    const id = randomUUID();
    const a = await cevap(OWNER, kart, { tip: "sik", index: (kart.dogru + 1) % kart.secenekler.length }, id);
    const b = await cevap(OWNER, kart, { tip: "sik", index: (kart.dogru + 1) % kart.secenekler.length }, id);
    assert.equal(a.json.duplicate, false);
    assert.equal(b.status, 200);
    assert.equal(b.json.duplicate, true);
    assert.equal(b.json.outcome, "incorrect");
    assert.equal(satir(await durum(OWNER), kart).yanlis, 1);
    const c = await cevap(OWNER, kart, { tip: "sik", index: kart.dogru }, id);
    assert.equal(c.status, 409);
    assert.equal(satir(await durum(OWNER), kart).yanlis, 1);
  });

  await kontrol("eşzamanlı 6 aynı olay: yalnız biri yeni, sayaç 1", async () => {
    const kart = tur("kod-oku")[2];
    const id = randomUUID();
    const yanlis = (kart.dogru + 1) % kart.secenekler.length;
    const sonuclar = await Promise.all(Array.from({ length: 6 }, () => cevap(OWNER, kart, { tip: "sik", index: yanlis }, id)));
    assert.ok(sonuclar.every((x) => x.status === 200), sonuclar.map((x) => x.status).join());
    assert.equal(sonuclar.filter((x) => x.json.duplicate === false).length, 1);
    assert.equal(satir(await durum(OWNER), kart).yanlis, 1);
  });

  await kontrol("kullanıcı yalıtımı: arkadaş owner durumunu görmez, aynı eventId ayrı kapsam", async () => {
    const d = await durum(FRIEND);
    assert.deepEqual(d.durumlar, []);
    const id = randomUUID();
    const o = await cevap(OWNER, sikKarti, { tip: "sik", index: sikKarti.dogru }, id);
    const f = await cevap(FRIEND, sikKarti, { tip: "sik", index: sikKarti.dogru }, id);
    assert.equal(o.json.duplicate, false);
    assert.equal(f.json.duplicate, false);
    assert.equal(satir(await durum(FRIEND), sikKarti).dogru, 1);
    assert.equal(satir(await durum(OWNER), sikKarti).dogru, 1);
    assert.equal(satir(await durum(OWNER), sikKarti).yanlis, 1);
  });

  await kontrol("reddedilenler: bilinmeyen kart 404, outcome kaçırma 400, tür uyuşmazlığı 400, taşan şık 400", async () => {
    const taban = { eventId: randomUUID(), cardId: "pak:yok-boyle-kart", kind: "answer", mode: "practice", secim: { tip: "sik", index: 0 } };
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: taban })).status, 404);
    const gercek = { ...taban, eventId: randomUUID(), cardId: `pak:${sikKarti.id}` };
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { ...gercek, outcome: "correct" } })).status, 400);
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { ...gercek, secim: { tip: "satir", n: 1 } } })).status, 400);
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { ...gercek, secim: { tip: "sik", index: 4 } } })).status, 400);
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { eventId: randomUUID(), cardId: "cur:eski-kart", kind: "view", mode: "learn", durationMs: 1 } })).status, 404);
  });

  await kontrol("tür başına doğruluk: hata-bul, sinav, odev, acikla", async () => {
    const hb = tur("hata-bul")[0];
    assert.equal((await cevap(OWNER, hb, { tip: "satir", n: hb.hataSatir })).json.outcome, "correct");
    const hb2 = tur("hata-bul")[1];
    assert.equal((await cevap(OWNER, hb2, { tip: "satir", n: hb2.hataSatir === 1 ? 2 : 1 })).json.outcome, "incorrect");
    const sn = tur("sinav")[0];
    assert.equal((await cevap(OWNER, sn, { tip: "dogruMu", deger: !sn.dogruMu })).json.outcome, "incorrect");
    const od = tur("odev")[0];
    assert.equal((await cevap(OWNER, od, { tip: "sira", sira: od.adimlar.map((_, i) => i) })).json.outcome, "correct");
    const od2 = tur("odev")[1];
    assert.equal((await cevap(OWNER, od2, { tip: "sira", sira: [1, 0] })).json.outcome, "incorrect");
    const ac = tur("acikla")[0];
    assert.equal((await cevap(OWNER, ac, { tip: "kendi", anladim: true })).json.outcome, "correct");
  });

  await kontrol("view ve preference olayları durumu günceller, cevap saymaz", async () => {
    const kart = tur("sinav")[1];
    const v = await istek("/api/feed/events", { kimlik: OWNER, govde: { eventId: randomUUID(), cardId: `pak:${kart.id}`, kind: "view", mode: "learn", durationMs: 1200 } });
    assert.equal(v.status, 200, v.metin);
    const p = await istek("/api/feed/events", { kimlik: OWNER, govde: { eventId: randomUUID(), cardId: `pak:${kart.id}`, kind: "preference", mode: "learn", preference: "like" } });
    assert.equal(p.status, 200, p.metin);
    const s = satir(await durum(OWNER), kart);
    assert.equal(s.goruldu, 1);
    assert.equal(s.tercih, "like");
    assert.equal(s.dogru + s.yanlis, 0);
    assert.equal(s.due, false);
  });

  await kontrol("/api/feed/akis/sor: sunucu kartı kendi okur (bilinmeyen kart 404, boş soru 400, geçerli SSE)", async () => {
    const sor = (govde) => istek("/api/feed/akis/sor", { kimlik: OWNER, govde });
    assert.equal((await sor({ kartId: "yok-boyle-kart", mesaj: "x" })).status, 404);
    assert.equal((await sor({ kartId: sikKarti.id, mesaj: "  " })).status, 400);
    const r = await sor({ kartId: sikKarti.id, mesaj: "Bu kod ne yapar?" });
    assert.equal(r.status, 200);
    assert.ok(r.metin.includes("data:") && r.metin.includes("[DONE]"));
  });

  await kontrol("ipucu: /sor ipucu 1..3 SSE döner, cevapta ipucu kabul, 4 reddedilir, GET gecTekrar verir", async () => {
    const kart = tur("cikti-tahmin")[1];
    for (const n of [1, 2, 3]) {
      const r = await istek("/api/feed/akis/sor", { kimlik: OWNER, govde: { kartId: kart.id, ipucu: n } });
      assert.equal(r.status, 200, r.metin);
      assert.ok(r.metin.includes("[DONE]"));
    }
    const govde = { eventId: randomUUID(), cardId: `pak:${kart.id}`, kind: "answer", mode: "practice", secim: { tip: "sik", index: kart.dogru } };
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { ...govde, ipucu: 2 } })).status, 200);
    assert.equal((await istek("/api/feed/events", { kimlik: OWNER, govde: { ...govde, eventId: randomUUID(), ipucu: 4 } })).status, 400);
    const d = await durum(OWNER);
    assert.ok(d.gecTekrar && "ertesiGun" in d.gecTekrar && "ucuncuGunVeSonrasi" in d.gecTekrar);
  });

  await kontrol("/api/feed/akis/uret: geçersiz istek 400, model yoksa 502 ve kayıt yok, başkasının/olmayan üretilmiş kart 404, silme kimliği denetlenir", async () => {
    const uret = (govde) => istek("/api/feed/akis/uret", { kimlik: OWNER, govde });
    assert.equal((await uret({ istek: "", ders: "EBLG351", hafta: 4 })).status, 400);
    assert.equal((await uret({ istek: "döngü", adet: 99, kartId: sikKarti.id })).status, 400);
    assert.equal((await uret({ istek: "döngü" })).status, 400, "ders/hafta ya da kart olmadan 400 beklenir");
    const r = await uret({ istek: "döngüler", kartId: sikKarti.id });
    assert.ok([200, 502].includes(r.status), `üretim ${r.status} ${r.metin}`);
    if (r.status === 502) assert.equal((await istek("/api/feed/akis/uret", { kimlik: OWNER })).json.kartlar.length, 0);
    const yok = await cevap(OWNER, { id: "uret-yok-boyle" }, { tip: "sik", index: 0 });
    assert.equal(yok.status, 404);
    assert.equal((await istek("/api/feed/akis/uret?id=pak:x", { kimlik: OWNER, yontem: "DELETE" })).status, 400);
    assert.deepEqual((await durum(OWNER)).uretilenler, []);
  });

  await kontrol("/api/chat: girişli akış bağlamıyla SSE döner, anonim reddedilir", async () => {
    const r = await istek("/api/chat", {
      kimlik: OWNER,
      govde: {
        messages: [{ role: "user", content: "Neden yanlış?" }],
        context: { kind: "akis-kart", file: sikKarti.dosya, source: "x = 1", explanation: sikKarti.aciklama },
      },
    });
    assert.equal(r.status, 200);
    assert.ok(r.metin.includes("data:") && r.metin.includes("[DONE]"));
    // Anonim POST en sona: proxy gövdeyi okumadan 401 verince miniflare sonraki isteği düşürüyor (mevcut davranış).
    const anon = await istek("/api/chat", { govde: { messages: [{ role: "user", content: "x" }] } });
    assert.ok([401, 503].includes(anon.status), `anonim chat ${anon.status}`);
  });

  console.log(`\n${say} kontrol geçti`);
} catch {
  console.log("\nBaşarısız.");
}
