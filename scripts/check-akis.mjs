// Akış kart paketlerini doğrular: node --experimental-strip-types scripts/check-akis.mjs [--kok DIR] [--min N]
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { akisPaketSchema } from "../lib/akis-paket.ts";

const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf(ad);
  return i === -1 ? varsayilan : process.argv[i + 1];
};
const kok = resolve(arg("--kok", fileURLToPath(new URL("..", import.meta.url))));
const min = Number(arg("--min", "6"));

const hatalar = [];
const hata = (dosya, mesaj) => hatalar.push(`${dosya}: ${mesaj}`);
const idler = new Map();
const satirSayisi = new Map();
let paketSayisi = 0;
let kartSayisi = 0;

const akisDizin = join(kok, "content", "akis");
const kapsam = JSON.parse(readFileSync(join(akisDizin, "kapsam.json"), "utf8"));
const notSayac = new Map();
const odevSayac = new Map();
const dersKlasorleri = existsSync(akisDizin) ? readdirSync(akisDizin, { withFileTypes: true }).filter((d) => d.isDirectory()) : [];

for (const klasor of dersKlasorleri) {
  const dosyalar = readdirSync(join(akisDizin, klasor.name)).filter((f) => f.endsWith(".json"));
  for (const ad of dosyalar) {
    const etiket = `${klasor.name}/${ad}`;
    let ham;
    try {
      ham = JSON.parse(readFileSync(join(akisDizin, klasor.name, ad), "utf8"));
    } catch (e) {
      hata(etiket, `JSON okunamadı (${e.message})`);
      continue;
    }
    const sonuc = akisPaketSchema.safeParse(ham);
    if (!sonuc.success) {
      for (const s of sonuc.error.issues.slice(0, 8)) hata(etiket, `şema: ${s.path.join(".")} ${s.message}`);
      continue;
    }
    paketSayisi++;
    const kartlar = sonuc.data.kartlar;
    kartSayisi += kartlar.length;
    if (kartlar.length < min) hata(etiket, `en az ${min} kart gerekli, ${kartlar.length} var`);
    for (const k of kartlar) {
      if (k.ders.toLowerCase() !== klasor.name) hata(etiket, `${k.id}: ders ${k.ders} klasörle (${klasor.name}) uyuşmuyor`);
      if (idler.has(k.id)) hata(etiket, `${k.id}: id ${idler.get(k.id)} içinde de var`);
      idler.set(k.id, etiket);
      const ks = kapsam[k.ders];
      if (!ks) hata(etiket, `${k.id}: kapsam.json'da ${k.ders} yok`);
      else if (k.odev) {
        if (!ks.odevler[k.odev]) hata(etiket, `${k.id}: odev ${k.odev} kapsam.json'da yok`);
        odevSayac.set(`${k.ders}/${k.odev}`, (odevSayac.get(`${k.ders}/${k.odev}`) ?? 0) + 1);
      } else {
        if (!ks.notlar[String(k.hafta)]) hata(etiket, `${k.id}: hafta ${k.hafta} kapsam.json notlar'da yok`);
        notSayac.set(`${k.ders}/${k.hafta}`, (notSayac.get(`${k.ders}/${k.hafta}`) ?? 0) + 1);
      }
      const kodYolu = k.dosya ? join(kok, "content", "odevler", k.ders.toLowerCase(), k.dosya) : null;
      if (kodYolu && !existsSync(kodYolu)) {
        hata(etiket, `${k.id}: kod dosyası yok (${k.dosya})`);
      } else if (kodYolu) {
        if (!satirSayisi.has(kodYolu)) satirSayisi.set(kodYolu, readFileSync(kodYolu, "utf8").split(/\r?\n/).length);
        if (k.satirlar[1] > satirSayisi.get(kodYolu)) hata(etiket, `${k.id}: satirlar ${k.satirlar[1]} dosya uzunluğunu (${satirSayisi.get(kodYolu)}) aşıyor`);
      }
      if (k.tur === "ne-olur" && k.gorsel) {
        for (const yol of [k.gorsel.once, k.gorsel.sonra]) {
          if (!existsSync(join(kok, "public", yol))) hata(etiket, `${k.id}: görsel yok (${yol})`);
        }
      }
    }
  }
}

for (const [ders, ks] of Object.entries(kapsam)) {
  for (const h of Object.keys(ks.notlar)) if ((notSayac.get(`${ders}/${h}`) ?? 0) < 3) hata("kapsam", `${ders} not haftası ${h}: en az 3 kart gerekli`);
  for (const o of Object.keys(ks.odevler)) if ((odevSayac.get(`${ders}/${o}`) ?? 0) < 3) hata("kapsam", `${ders} ödev ${o}: en az 3 kart gerekli`);
}

if (paketSayisi === 0 && hatalar.length === 0) hata("content/akis", "hiç paket bulunamadı");

for (const h of hatalar) console.log("HATA", h);
console.log(`${paketSayisi} paket, ${kartSayisi} kart, ${hatalar.length} hata`);
process.exit(hatalar.length ? 1 : 0);
