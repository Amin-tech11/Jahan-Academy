import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.split("/")[1] === "en" ? "en" : "fa";
  const headers = new Headers(request.headers);
  headers.set("x-jahan-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"] };
