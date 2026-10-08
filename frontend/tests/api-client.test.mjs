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
  assert.equal(request.options.headers["Idempotency-Key"], "request-1");
  assert.equal(request.options.headers["Content-Type"], "application/json");
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
