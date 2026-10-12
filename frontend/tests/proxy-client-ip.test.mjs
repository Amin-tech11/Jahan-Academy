import test from "node:test";
import assert from "node:assert/strict";
import { trustedClientHeaders } from "../lib/proxy-client-ip.ts";

test("BFF ignores untrusted forwarded identities and only forwards validated internal headers", () => {
  const secret = "s".repeat(48);
  assert.deepEqual(trustedClientHeaders(new Headers({ "x-forwarded-for": "1.2.3.4" }), secret), {});
  assert.deepEqual(trustedClientHeaders(new Headers({ "x-jahan-proxy-key": "wrong", "x-jahan-client-ip": "1.2.3.4" }), secret), {});
  assert.deepEqual(trustedClientHeaders(new Headers({ "x-jahan-proxy-key": secret, "x-jahan-client-ip": "1.2.3.4,5.6.7.8" }), secret), {});
  assert.deepEqual(trustedClientHeaders(new Headers({ "x-jahan-proxy-key": secret, "x-jahan-client-ip": "2001:db8::1" }), secret), { "x-jahan-proxy-key": secret, "x-jahan-client-ip": "2001:db8::1" });
});
