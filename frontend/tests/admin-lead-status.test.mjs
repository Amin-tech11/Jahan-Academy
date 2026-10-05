import assert from "node:assert/strict";
import test from "node:test";
import { canChangeLeadStatus, saveLeadChanges } from "../lib/admin-lead-status.ts";
import { adminRequest, AdminError } from "../lib/admin-api.ts";
import { leadStatuses, resources, labels } from "../lib/admin-resources.ts";

const lead = { id: "example", status: "assigned", version: 3, assignee: { id: "consultant" } };

test("assigned is absent from consultation choices while legacy records remain readable and editable", async () => {
  assert.equal(leadStatuses.includes("assigned"), false);
  assert.equal(resources.find((item) => item.id === "leads").statuses.includes("assigned"), false);
  assert.equal(labels.assigned, "ارجاع‌شده");
  const calls = [];
  await saveLeadChanges(async (...args) => { calls.push(args); return {}; }, lead, undefined, "contacted", () => assert.fail());
  assert.equal(calls[0][2].toStatus, "contacted");
});

test("workflow choices respect assignment, terminal states and archive", () => {
  assert.equal(canChangeLeadStatus({ status: "new" }, "assigned"), false);
  assert.equal(canChangeLeadStatus({ status: "new" }, "closed"), true);
  assert.equal(canChangeLeadStatus(lead, "contacted"), true);
  assert.equal(canChangeLeadStatus(lead, "converted"), false);
  assert.equal(canChangeLeadStatus({ ...lead, status: "closed" }, "new"), false);
  assert.equal(canChangeLeadStatus({ ...lead, archived: true }, "closed"), false);
});

test("status-only save sends a versioned transition, never a generic PATCH", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify({ data: { ...lead, status: "contacted", version: 4 } }));
  };
  try {
    await saveLeadChanges(adminRequest, lead, undefined, "contacted", () => assert.fail("no patch"));
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/admin/api/admin/leads/example/status-transitions");
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].headers["If-Match"], '"3"');
    assert.deepEqual(JSON.parse(calls[0].body), { toStatus: "contacted" });
  } finally { globalThis.fetch = originalFetch; }
});

test("combined edits use the PATCH response version for the status transition", async () => {
  const calls = [];
  const patched = { ...lead, version: 4, occupation: "Engineer" };
  const request = async (...args) => { calls.push(args); return { data: patched }; };
  let saved;
  await saveLeadChanges(request, lead, { occupation: "Engineer" }, "contacted", (row) => { saved = row; });
  assert.equal(saved, patched);
  assert.deepEqual(calls, [
    ["/admin/leads/example", "PATCH", { occupation: "Engineer" }, 3],
    ["/admin/leads/example/status-transitions", "POST", { toStatus: "contacted" }, 4],
  ]);
});

test("partial success retains saved data/version and retry changes only status", async () => {
  let saved = lead;
  let calls = 0;
  const request = async () => {
    if (++calls === 1) return { data: { ...lead, version: 4 } };
    throw new AdminError(403, "برای این عملیات مجوز ندارید.");
  };
  await assert.rejects(saveLeadChanges(request, lead, { occupation: "Engineer" }, "contacted", (row) => { saved = row; }), /اطلاعات رکورد ذخیره شد، اما وضعیت تغییر نکرد/);
  assert.equal(saved.version, 4);
  const retry = [];
  await saveLeadChanges(async (...args) => { retry.push(args); return {}; }, saved, undefined, "contacted", () => assert.fail());
  assert.equal(retry.length, 1);
  assert.equal(retry[0][3], 4);
});

test("failed PATCH stops transition; stale and denied status errors propagate", async () => {
  for (const patch of [undefined, { occupation: "Engineer" }]) {
    for (const code of [403, 412]) {
      let calls = 0;
      const error = new AdminError(code, "Rejected");
      await assert.rejects(saveLeadChanges(async () => { calls++; throw error; }, lead, patch, "contacted", () => assert.fail()), (caught) => caught === error);
      assert.equal(calls, 1);
    }
  }
});

test("unchanged status does not transition, invalid selection saves nothing", async () => {
  const calls = [];
  const request = async (...args) => { calls.push(args); return { data: lead }; };
  await saveLeadChanges(request, lead, { occupation: "Engineer" }, "assigned", () => {});
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "PATCH");
  await assert.rejects(saveLeadChanges(request, lead, { occupation: "Engineer" }, "converted", () => assert.fail()));
  assert.equal(calls.length, 1);
});
