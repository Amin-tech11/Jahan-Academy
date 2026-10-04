import assert from "node:assert/strict";

const base = process.env.ADMIN_WEB_URL ?? "http://localhost:3500";
const page = await fetch(`${base}/admin`);
assert.equal(page.status, 200);
assert.match(await page.text(), /noindex/);
for (const path of [
  "admin/leads",
  "admin/universities",
  "admin/programs",
  "admin/media",
]) {
  const response = await fetch(`${base}/admin/api/${path}`);
  assert.equal(
    response.status,
    401,
    `Unauthenticated ${path} must be denied by the API`,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
}
const crossOrigin = await fetch(`${base}/admin/api/auth/refresh`, {
  method: "POST",
  headers: {
    Origin: "http://other-origin.invalid",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(crossOrigin.status, 403);
const registration = await fetch(`${base}/admin/api/auth/register`, {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json" },
  body: "{}",
});
assert.equal(registration.status, 404);
console.log(
  "PASS: admin page, noindex, four protected resources, no-store, cross-origin rejection, registration rejection",
);
for (const path of ["admin/staff", "reporting/dashboard", "admin/audit-logs"]) {
  const response = await fetch(`${base}/admin/api/${path}`);
  assert.ok(
    [401, 404].includes(response.status),
    `Unexpected availability response for ${path}`,
  );
  console.log(
    `${response.status === 404 ? "UNAVAILABLE in running backend" : "PROTECTED"}: ${path}`,
  );
}
