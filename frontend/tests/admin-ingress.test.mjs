import test from "node:test";
import assert from "node:assert/strict";
import { admit, boundedBody } from "../lib/admin-ingress.ts";
const request = (body, headers = {}) => new Request("http://localhost/test", { method: "POST", body, headers, duplex: "half" });
test("byte limit rejects declared and chunked bodies, including lying content length", async () => {
  await assert.rejects(boundedBody(request("abcd", {"content-length":"4"}), 3), {status:413});
  await assert.rejects(boundedBody(request("abcd", {"content-length":"1"}), 3), {status:413});
  await assert.rejects(boundedBody(request("🌏"), 3), {status:413});
  assert.equal(await boundedBody(request("🌏"), 4), "🌏");
});
test("stalled streams time out and are cancelled", async () => {
  let cancelled = false;
  const stream = new ReadableStream({cancel(){cancelled=true}});
  await assert.rejects(boundedBody(request(stream), 100, 15), {status:408});
  assert.ok(cancelled);
});
test("concurrency is bounded and release is idempotent", () => {
  const now = Date.now()+100000;
  const releases = Array.from({length:8},()=>admit("capacity",now));
  assert.throws(()=>admit("another",now), {status:429});
  releases.forEach(release=>{release();release()});
  admit("another",now)();
});
test("early rejected requests still consume the request budget", () => {
  const now = Date.now()+200000;
  for(let i=0;i<60;i++) admit("invalid-login",now)();
  assert.throws(()=>admit("invalid-login",now), {status:429});
  admit("invalid-login",now+60001)();
});

test("a throttled client cannot spend other clients' global budget", () => {
  const now = Date.now()+400000;
  for(let i=0;i<60;i++) admit("noisy",now)();
  for(let i=0;i<1000;i++) assert.throws(()=>admit("noisy",now), {status:429});
  for(let c=0;c<4;c++) for(let i=0;i<60;i++) admit(`fresh-${c}`,now)();
  assert.throws(()=>admit("global-full",now), {status:429});
  admit("global-full",now+60001)();
});
