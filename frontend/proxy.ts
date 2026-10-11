import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Locale comes from static route params; do not make public HTML request-dependent.
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  const headers = new Headers(request.headers);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${process.env.NODE_ENV === "development" ? " ws:" : ""}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
