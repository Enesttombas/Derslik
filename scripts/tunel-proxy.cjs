// Tünel önü: yalnız gizli bağlantıyı (?k=<anahtar>) bilenleri geçirir, sahip kimliğini ekler ve çalışan uygulamaya iletir.
// Yalnız 127.0.0.1'e bağlanır; internete tünel aracı (ngrok vb.) açar. Anahtar ortam değişkeninden ya da dosyadan gelir.
// Kullanım: DERSLIK_ANAHTAR=... node scripts/tunel-proxy.cjs [hedefPort=8801] [dinlePort=8803]
const http = require("http");
const crypto = require("crypto");

const hedefPort = Number(process.argv[2] || 8801);
const dinlePort = Number(process.argv[3] || 8803);
const anahtar = process.env.DERSLIK_ANAHTAR;
if (!anahtar || anahtar.length < 16) throw new Error("DERSLIK_ANAHTAR (en az 16 karakter) gerekli.");
const SAHIP = { "oai-authenticated-user-id": "prev_owner", "oai-authenticated-user-email": "owner@derslik.test" };
const ACIK = new Set(["/manifest.webmanifest", "/favicon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"]);

const esit = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const cerezAnahtari = (q) => /(?:^|;\s*)derslik=([^;]+)/.exec(q.headers.cookie || "")?.[1] || "";

http.createServer((q, r) => {
  const url = new URL(q.url, "http://x");
  const gelen = url.searchParams.get("k");
  if (gelen && esit(gelen, anahtar)) {
    url.searchParams.delete("k");
    r.writeHead(302, {
      Location: url.pathname + url.search,
      "Set-Cookie": `derslik=${anahtar}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
      "Cache-Control": "no-store",
    });
    return r.end();
  }
  if (!ACIK.has(url.pathname) && !esit(cerezAnahtari(q), anahtar)) {
    r.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
    return r.end("Bu site özel. Sahibinden aldığın bağlantıyla gir.");
  }
  const basliklar = { ...q.headers, ...SAHIP };
  delete basliklar.cookie;
  const p = http.request({ host: "127.0.0.1", port: hedefPort, path: q.url, method: q.method, headers: basliklar }, (x) => {
    r.writeHead(x.statusCode, { ...x.headers, "X-Robots-Tag": "noindex" });
    x.pipe(r);
  });
  p.on("error", () => { r.statusCode = 502; r.end(); });
  q.pipe(p);
}).listen(dinlePort, "127.0.0.1", () => console.log(`tünel önü: http://127.0.0.1:${dinlePort}`));
