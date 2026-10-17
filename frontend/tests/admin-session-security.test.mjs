import assert from "node:assert/strict";
import { test } from "node:test";
import { trackAdminActivity } from "../lib/admin-activity.ts";
import { setReauthHandler } from "../lib/admin-reauth.ts";
import { adminRequest, clearAdminSession } from "../lib/admin-api.ts";

test("only trusted user input produces activity, throttled to once per minute", async () => {
  const listeners = new Map();
  const target = { document: { hidden: false }, addEventListener: (name, listener) => listeners.set(name, listener), removeEventListener: name => listeners.delete(name) };
  let calls = 0;
  const stop = trackAdminActivity(target, async () => { calls++; });
  assert.equal(calls, 0);
  listeners.get("keydown")({ isTrusted: false });
  assert.equal(calls, 0);
  listeners.get("pointerdown")({ isTrusted: true });
  await new Promise(resolve => setImmediate(resolve));
  listeners.get("keydown")({ isTrusted: true });
  assert.equal(calls, 1);
  stop(); assert.equal(listeners.size, 0);
});

test("step-up retries exactly the pending operation with its one-use proof", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  const operation = { path: "/admin/staff/example/panel-access", method: "PUT" };
  const dispose = setReauthHandler(async request => { assert.deepEqual(request, operation); return "one-use-proof"; });
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, `/admin/api${operation.path}`);
    assert.equal(options.method, "PUT");
    assert.deepEqual(JSON.parse(options.body), { sections: [] });
    assert.equal(options.headers["If-Match"], '"7"');
    if (calls === 1) return Response.json({ error: { code: "REAUTH_REQUIRED" } }, { status: 403 });
    assert.equal(options.headers["X-Reauth-Token"], "one-use-proof");
    return Response.json({ data: { version: 8 } });
  };
  try { assert.equal((await adminRequest(operation.path, "PUT", { sections: [] }, 7)).data.version, 8); assert.equal(calls, 2); }
  finally { globalThis.fetch = original; dispose(); clearAdminSession(); }
});

test("cancelling step-up never sends the pending mutation again", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  const dispose = setReauthHandler(async () => { throw new Error("cancelled"); });
  globalThis.fetch = async () => { calls++; return Response.json({ error: { code: "REAUTH_REQUIRED" } }, { status: 403 }); };
  try { await assert.rejects(adminRequest("/admin/staff/example", "PATCH", { active: false }), /cancelled/); assert.equal(calls, 1); }
  finally { globalThis.fetch = original; dispose(); clearAdminSession(); }
});
