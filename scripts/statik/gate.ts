// Netlify Edge Function: yalnız gizli bağlantıyı bilenler girer.
// Bağlantı ?k=<GIRIS_ANAHTARI> ile gelir; doğruysa çerez yazılır, adres temizlenir. Anahtar Netlify ortam değişkenindedir.
import type { Context } from "@netlify/edge-functions";

const ACIK = new Set(["/manifest.webmanifest", "/favicon.svg", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"]);
const sabitZamanli = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let f = 0;
  for (let i = 0; i < a.length; i++) f |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return f === 0;
};

export default async (request: Request, context: Context) => {
  const anahtar = Netlify.env.get("GIRIS_ANAHTARI");
  if (!anahtar) return new Response("Yapılandırılmadı.", { status: 503 });
  const url = new URL(request.url);
  if (ACIK.has(url.pathname)) return context.next();

  const gelen = url.searchParams.get("k");
  if (gelen && sabitZamanli(gelen, anahtar)) {
    url.searchParams.delete("k");
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.pathname + url.search,
        "Set-Cookie": `derslik=${anahtar}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
        "Cache-Control": "no-store",
      },
    });
  }
  const cerez = /(?:^|;\s*)derslik=([^;]+)/.exec(request.headers.get("cookie") ?? "")?.[1] ?? "";
  if (cerez && sabitZamanli(cerez, anahtar)) {
    const yanit = await context.next();
    yanit.headers.set("X-Robots-Tag", "noindex, nofollow");
    yanit.headers.set("Cache-Control", "private, no-cache");
    return yanit;
  }
  return new Response("Bu site özel. Sahibinden aldığın bağlantıyla gir.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/*" };
