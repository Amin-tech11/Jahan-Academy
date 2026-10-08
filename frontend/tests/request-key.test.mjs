import assert from "node:assert/strict";
import test from "node:test";
import { createRequestKey } from "../lib/request-key.ts";

test("HTTP LAN requests get unique UUIDs without secure-context randomUUID", () => {
  const httpCrypto = { getRandomValues: crypto.getRandomValues.bind(crypto) };
  const keys = Array.from({ length: 1000 }, () => createRequestKey(httpCrypto));
  assert.equal(new Set(keys).size, keys.length);
  for (const key of keys) assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("HTTPS and localhost retain the native UUID generator", () => {
  assert.equal(createRequestKey({ randomUUID: () => "native-key", getRandomValues: () => { throw new Error("Unused"); } }), "native-key");
});
