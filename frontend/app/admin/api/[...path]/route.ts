import { NextRequest, NextResponse } from "next/server";
import { loginPayload } from "../../../../lib/admin-login";

export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)))
    return new NextResponse(null, { status: 404 });
  const relative = path.join("/");
  const allowed =
    relative.startsWith("admin/") ||
    relative === "users/me" ||
    relative === "users/me/panel-access" ||
    relative === "reporting/dashboard" ||
    /^auth\/(login|refresh|logout|password-reset-requests|password-resets)$/.test(
      relative,
    );
  if (!allowed) return new NextResponse(null, { status: 404 });
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== request.nextUrl.origin
  )
    return new NextResponse(null, { status: 403 });
  const base = (
    process.env.ADMIN_API_URL ??
    process.env.API_INTERNAL_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  for (const name of ["authorization", "cookie", "if-match"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const csrf = request.cookies.get(
    process.env.ADMIN_CSRF_COOKIE ?? "jahan_csrf",
  )?.value;
  if (csrf) headers.set("x-csrf-token", csrf);
  let body = request.method === "GET" ? undefined : await request.text();
  if (relative === "auth/login" && request.method === "POST") {
    let input: unknown;
    try {
      input = JSON.parse(body ?? "{}");
    } catch {
      input = null;
    }
    const payload = loginPayload(input, {
      environment: process.env.NODE_ENV,
      username: process.env.ADMIN_LOCAL_USERNAME,
      email: process.env.ADMIN_LOCAL_EMAIL,
    });
    if (!payload)
      return NextResponse.json(
        { error: { message: "نام کاربری یا رمز عبور معتبر نیست." } },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    body = JSON.stringify(payload);
  }
  try {
    const upstream = await fetch(
      `${base}${base.endsWith("/api/v1") ? "" : "/api/v1"}/${relative}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        ...(body === undefined ? {} : { body }),
      },
    );
    const response = new NextResponse(
      upstream.status === 204 ? null : await upstream.text(),
      {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
    const etag = upstream.headers.get("etag");
    if (etag) response.headers.set("etag", etag);
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append(
        "Set-Cookie",
        cookie.replace(/Path=\/api\/v1\/auth/gi, "Path=/admin/api/auth"),
      );
    return response;
  } catch {
    return NextResponse.json(
      { error: { message: "سرویس API در دسترس نیست." } },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH };
