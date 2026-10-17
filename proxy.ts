import { env } from "cloudflare:workers";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (["/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"].includes(path)) {
    return NextResponse.next();
  }

  // Next.js App Router page and API routes
  const isAppRoute = path === "/" || path.startsWith("/api/");

  if (!isAppRoute) {
    const assets = (env as unknown as { ASSETS?: { fetch(request: Request): Promise<Response> } }).ASSETS;
    return assets ? assets.fetch(request) : new Response("Assets unavailable.", { status: 503 });
  }

  const siteEnv = env as unknown as { OWNER_EMAIL?: string; ALLOWED_EMAILS?: string };
  const ownerEmail = import.meta.env.DEV ? "seedy@sites.test" : siteEnv.OWNER_EMAIL;
  if (!ownerEmail) return new Response("Site owner is not configured.", { status: 503 });
  // Invited friends: comma-separated allowlist. Each user's cards, PDFs and reviews stay
  // isolated by user id in the API routes; only the static curriculum is shared.
  const allowedEmails = new Set(
    [ownerEmail, ...(siteEnv.ALLOWED_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  const visitorEmail = request.headers.get("oai-authenticated-user-email");
  if (!visitorEmail) {
    if (path.startsWith("/api/")) return new Response("Sign in required.", { status: 401 });
    const signIn = new URL("/signin-with-chatgpt", request.url);
    signIn.searchParams.set("return_to", path + request.nextUrl.search);
    return NextResponse.redirect(signIn);
  }
  if (!allowedEmails.has(visitorEmail.trim().toLowerCase())) {
    return new Response("Bu siteye erişimin yok.", { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
