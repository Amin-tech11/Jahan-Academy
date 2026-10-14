import assert from "node:assert/strict";
import { test } from "node:test";
import { analyticsHostAllowed, analyticsPageLocation, analyticsReferrer, GA_MEASUREMENT_ID } from "../lib/google-analytics.ts";

test("analytics runs only on the production domain", () => {
  assert.equal(GA_MEASUREMENT_ID, "G-54XY5B8GLK");
  for (const host of ["jahanacademi.ir", "www.jahanacademi.ir"]) assert.ok(analyticsHostAllowed(host));
  for (const host of ["localhost", "127.0.0.1", "jahanacademi.ir.attacker.test"]) assert.equal(analyticsHostAllowed(host), false);
});

test("page locations exclude private routes and query or fragment values", () => {
  assert.equal(analyticsPageLocation("/fa/consultation?email=private@example.com#tracking"), "https://jahanacademi.ir/fa/consultation");
  assert.equal(analyticsPageLocation("/en/guides/germany-study-residence-guide"), "https://jahanacademi.ir/en/guides/germany-study-residence-guide");
  for (const path of ["/admin", "/admin/leads", "/fa/admin", "/en/admin/leads", "/api/v1/users"]) assert.equal(analyticsPageLocation(path), null);
});

test("referrers retain public paths but remove external query and path data", () => {
  assert.equal(analyticsReferrer("https://jahanacademi.ir/fa?email=private"), "https://jahanacademi.ir/fa");
  assert.equal(analyticsReferrer("https://jahanacademi.ir/admin?token=private"), "");
  assert.equal(analyticsReferrer("https://search.example/search?q=private"), "https://search.example");
  assert.equal(analyticsReferrer("javascript:alert(1)"), "");
  assert.equal(analyticsReferrer(""), "");
});
