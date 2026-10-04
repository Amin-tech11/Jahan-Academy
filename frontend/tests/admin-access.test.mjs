import assert from "node:assert/strict";
import { test } from "node:test";
import { filterPanelSections } from "../lib/admin-access-policy.ts";

const sections = ["dashboard", "leads", "universities", "staff", "audit", "access"].map(id => ({ id }));
test("super admin sees every section; staff see only their individually allowed sections", () => {
  assert.deepEqual(filterPanelSections(sections, { isSuperAdmin: true, sections: [] }), sections);
  assert.deepEqual(filterPanelSections(sections, { isSuperAdmin: false, sections: ["leads"] }), [{ id: "leads" }]);
  assert.deepEqual(filterPanelSections(sections, { isSuperAdmin: false, sections: ["universities"] }), [{ id: "universities" }]);
});
test("loading, revoked and reserved access fail closed", () => {
  assert.deepEqual(filterPanelSections(sections, null), []);
  assert.deepEqual(filterPanelSections(sections, { isSuperAdmin: false, sections: [] }), []);
  assert.deepEqual(filterPanelSections(sections, { isSuperAdmin: false, sections: ["staff", "audit", "access", "unknown"] }), []);
});
