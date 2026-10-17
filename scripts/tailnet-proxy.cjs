// Telefondan (Tailscale) erişim: çalışan Derslik sunucusunun önüne sahip kimliğini ekler.
// Yalnız Tailscale arayüzüne (100.x) ve loopback'e bağlanır; LAN'a / internete açılmaz.
// Kullanım: node scripts/tailnet-proxy.cjs [hedefPort=8801] [dinlePort=8802]
const http = require("http");
const os = require("os");

const hedefPort = Number(process.argv[2] || 8801);
const dinlePort = Number(process.argv[3] || 8802);
const SAHIP = { "oai-authenticated-user-id": "prev_owner", "oai-authenticated-user-email": "owner@derslik.test" };

const tailnetAdresi = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .find((a) => a && a.family === "IPv4" && /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(a.address))?.address;

const sunucu = http.createServer((q, r) => {
  const p = http.request(
    { host: "127.0.0.1", port: hedefPort, path: q.url, method: q.method, headers: { ...q.headers, ...SAHIP } },
    (x) => { r.writeHead(x.statusCode, x.headers); x.pipe(r); },
  );
  p.on("error", () => { r.statusCode = 502; r.end(); });
  q.pipe(p);
});

const bagla = () => {
  const adres = tailnetAdresi();
  if (!adres) { console.log("Tailscale kapalı; 10 sn sonra tekrar denenecek."); return setTimeout(bagla, 10000); }
  sunucu.listen(dinlePort, adres, () => console.log(`http://${adres}:${dinlePort}`));
};
sunucu.on("error", (e) => { console.log("dinleme hatası:", e.code); setTimeout(bagla, 10000); });
bagla();
