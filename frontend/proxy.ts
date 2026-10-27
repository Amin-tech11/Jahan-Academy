import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { storageOrigin } from "./lib/storage-origin";

export function proxy(request: NextRequest) {
  const admin = request.nextUrl.pathname.startsWith("/admin");
  const headers = new Headers(request.headers);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const storage = storageOrigin(process.env.ADMIN_STORAGE_ORIGIN);
  const analytics = admin ? "" : " https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com";
  const advertising = /^\/(fa|en)(\/|$)/.test(request.nextUrl.pathname) && !/^\/(fa|en)\/admin(\/|$)/.test(request.nextUrl.pathname);
  const adImages = !advertising ? "" : " https://ua.yektanet.com https://plus.sabavision.com";
  const adConnections = !advertising ? "" : " https://ua.yektanet.com https://event.yektanet.com https://audience.yektanet.com";
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:${analytics}${adImages}; font-src 'self'; connect-src 'self'${admin && storage ? ` ${storage}` : ""}${analytics}${adConnections}${process.env.NODE_ENV === "development" ? " ws:" : ""};${admin ? "" : " frame-src https://maps.google.com https://www.google.com/maps/" + (advertising ? " https://cdn.yektanet.com" : "") + ";"} object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  // Request-specific nonces must never be served from shared HTML caches.
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
