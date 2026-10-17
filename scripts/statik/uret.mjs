// Statik Netlify çıktısı üretir.
// Kullanım: node scripts/statik/uret.mjs <calisan-uygulama-url> <dist/client dizini> <cikti dizini>
// Çalışan uygulama (kimlik başlığı eklenmiş) sayfa HTML'ini ve /api verisini verir; derleme varlıkları dist/client'tan gelir.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [taban, istemci, cikti] = process.argv.slice(2);
if (!taban || !istemci || !cikti) throw new Error("Kullanım: uret.mjs <url> <dist/client> <cikti>");
const burasi = dirname(fileURLToPath(import.meta.url));

const getir = async (yol) => {
  const r = await fetch(taban + yol);
  if (!r.ok) throw new Error(`${yol} -> ${r.status}`);
  return r;
};
const jsonGetir = async (yol) => (await getir(yol)).json();

const dersler = (await jsonGetir("/api/courses")).courses;
const v = { courses: dersler, curriculum: await jsonGetir("/api/curriculum"), units: {}, pdfs: {}, notes: {}, feed: {}, cards: [] };
v.cards = (await jsonGetir("/api/cards")).cards;
v.feed[""] = await jsonGetir("/api/feed?mode=learn");
for (const d of dersler) {
  const q = encodeURIComponent(d.id);
  v.units[d.id] = (await jsonGetir(`/api/units?courseId=${q}`)).units ?? [];
  v.pdfs[d.id] = [];
  v.notes[d.id] = (await jsonGetir(`/api/notes?courseId=${q}`)).notes ?? [];
  v.feed[d.id] = await jsonGetir(`/api/feed?mode=learn&courseId=${q}`);
}

rmSync(cikti, { recursive: true, force: true });
mkdirSync(cikti, { recursive: true });
cpSync(resolve(istemci), cikti, { recursive: true });

let html = await (await getir("/")).text();
html = html.replace("<head>", '<head><script src="/statik-api.js"></script>');
// Sunucu uç noktasına bağlı kayıtlı hizmet işçisini devre dışı bırak (eski önbellek karışmasın).
writeFileSync(join(cikti, "index.html"), html);
cpSync(join(burasi, "statik-api.js"), join(cikti, "statik-api.js"));
mkdirSync(join(cikti, "statik"), { recursive: true });
writeFileSync(join(cikti, "statik", "veri.json"), JSON.stringify(v));
writeFileSync(join(cikti, "_headers"), "/statik-api.js\n  Cache-Control: no-cache\n/statik/veri.json\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n");
if (!existsSync(join(cikti, "index.html"))) throw new Error("index.html yazılamadı");
console.log(`tamam: ${cikti} (${dersler.length} ders, ${v.cards.length} kart)`);
