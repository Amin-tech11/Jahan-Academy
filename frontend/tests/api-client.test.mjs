import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { ApiError, apiBaseUrl, apiRequest, apiUrl } from "../lib/api-client.ts";

const originalFetch = globalThis.fetch;
const originalInternal = process.env.API_INTERNAL_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalInternal === undefined) delete process.env.API_INTERNAL_URL;
  else process.env.API_INTERNAL_URL = originalInternal;
});

test("API URL keeps a single version prefix and encodes filters", () => {
  process.env.API_INTERNAL_URL = "http://backend:8000/";
  assert.equal(apiBaseUrl(true), "http://backend:8000/api/v1");
  process.env.API_INTERNAL_URL = "http://backend:8000/api/v1///";
  assert.equal(apiBaseUrl(true), "http://backend:8000/api/v1");
  assert.equal(apiUrl("/universities", { locale: "fa", limit: 20, archived: false, skip: null }, apiBaseUrl(true)), "http://backend:8000/api/v1/universities?locale=fa&limit=20&archived=false");
  assert.throws(() => apiUrl("//elsewhere.example", {}, "/api/v1"), TypeError);
});

test("API request serializes JSON and forwards idempotency header", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ data: { reference: "JA-123" } }), { status: 201, headers: { "Content-Type": "application/json" } });
  };
  const result = await apiRequest("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": "request-1" }, body: { mobile: "+989123456789" } });
  assert.deepEqual(result, { data: { reference: "JA-123" } });
  assert.equal(new Headers(request.options.headers).get("Idempotency-Key"), "request-1");
  assert.equal(new Headers(request.options.headers).get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(request.options.body), { mobile: "+989123456789" });
});

test("API errors retain status, code, message and field errors", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Invalid mobile", fieldErrors: { mobile: ["Invalid"] } } }), { status: 422 });
  await assert.rejects(apiRequest("/consultation-requests"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 422);
    assert.equal(error.code, "VALIDATION_ERROR");
    assert.deepEqual(error.fieldErrors, { mobile: ["Invalid"] });
    return true;
  });
});

test("lost consultation response replays identical body and key once", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push(options);
    if (requests.length === 1) throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify({ data: { reference: "JA-REPLAY" } }), { status: 201 });
  };
  const result = await apiRequest("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": "stable-request-key" }, body: { locale: "fa", mobile: "+12025550199" } });
  assert.equal(result.data.reference, "JA-REPLAY");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body, requests[1].body);
  assert.deepEqual(requests[0].headers, requests[1].headers);
});

test("timeout while reading receipt is replayed and not mistaken for null success", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return { status: 201, ok: true, text: async () => { throw new DOMException("late body", "TimeoutError"); } };
    return new Response(JSON.stringify({ data: { reference: "JA-LATE" } }), { status: 201 });
  };
  assert.equal((await apiRequest("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": "stable-request-key" } })).data.reference, "JA-LATE");
  assert.equal(calls, 2);
});

test("exhausted transport retries report unconfirmed submission without claiming failure", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new TypeError("Failed to fetch"); };
  await assert.rejects(apiRequest("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": "stable-request-key" }, body: { locale: "fa" } }), error => {
    assert.equal(error.code, "SUBMISSION_UNCONFIRMED");
    assert.match(error.message, /تأیید ثبت درخواست دریافت نشد/);
    return true;
  });
  assert.equal(calls, 2);
});

test("unkeyed writes and caller cancellation are never automatically retried", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new TypeError("network"); };
  await assert.rejects(apiRequest("/consultation-requests", { method: "POST" }));
  assert.equal(calls, 1);
  calls = 0;
  const controller = new AbortController(); controller.abort();
  await assert.rejects(apiRequest("/consultation-requests", { method: "POST", signal: controller.signal, headers: { "Idempotency-Key": "stable-request-key" } }));
  assert.equal(calls, 1);
});

test("HTTP validation and service errors are returned without automatic retry", async () => {
  for (const status of [422, 429, 503]) {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return new Response(JSON.stringify({ error: { code: "REJECTED", message: "Try later" } }), { status }); };
    await assert.rejects(apiRequest("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": "stable-request-key" } }), error => error.status === status);
    assert.equal(calls, 1);
  }
});

test("a successful status without a receipt is verified again using Headers input", async () => {
  for (const status of [201, 204]) {
    let calls = 0;
    globalThis.fetch = async (_url, options) => {
      assert.equal(new Headers(options.headers).get("Idempotency-Key"), "stable-receipt-key");
      assert.equal(new Headers(options.headers).get("Content-Type"), "application/json");
      assert.equal(new Headers(options.headers).get("Accept"), "application/json");
      calls += 1;
      return calls === 1
        ? new Response(status === 204 ? null : "<html>Unexpected proxy response</html>", { status })
        : new Response(JSON.stringify({ data: { reference: "JA-VERIFIED" } }), { status: 201 });
    };
    const result = await apiRequest("/consultation-requests", { method: "POST", headers: new Headers({ "Idempotency-Key": "stable-receipt-key", "Content-Type": "application/json", Accept: "application/json" }) });
    assert.equal(result.data.reference, "JA-VERIFIED");
    assert.equal(calls, 2);
  }
});
