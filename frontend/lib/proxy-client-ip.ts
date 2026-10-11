import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

/** Never treat a browser-controlled X-Forwarded-For as a trusted identity. */
export function trustedClientHeaders(headers: Headers, secret?: string): Record<string, string> {
  const supplied = headers.get("x-jahan-proxy-key") ?? "";
  const address = headers.get("x-jahan-client-ip") ?? "";
  if (!secret || secret.length < 32 || !isIP(address)) return {};
  const actual = Buffer.from(supplied), expected = Buffer.from(secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return {};
  return { "x-jahan-proxy-key": secret, "x-jahan-client-ip": address };
}
