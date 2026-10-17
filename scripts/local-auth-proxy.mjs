// Local-only preview helper: forwards 127.0.0.1:8788 to the built worker on 8791 and adds the
// sign-in headers the hosting platform would inject. Never expose this outside localhost.
import http from "node:http";

const target = { host: "127.0.0.1", port: Number(process.env.WORKER_PORT || 8791) };
const email = process.env.LOCAL_EMAIL || "owner@derslik.test";
const port = Number(process.env.PROXY_PORT || 8788);

http
  .createServer((req, res) => {
    const headers = { ...req.headers, host: `${target.host}:${target.port}` };
    for (const name of Object.keys(headers)) {
      if (name.startsWith("oai-authenticated-user-")) delete headers[name];
    }
    headers["oai-authenticated-user-email"] = email;
    headers["oai-authenticated-user-id"] = `local_${email}`;
    const upstream = http.request({ ...target, path: req.url, method: req.method, headers }, (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    });
    upstream.on("error", () => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end("Derleme sunucusu (8791) çalışmıyor.");
    });
    req.pipe(upstream);
  })
  .listen(port, "127.0.0.1", () => console.log(`Derslik yerel önizleme: http://127.0.0.1:${port} (${email})`));
