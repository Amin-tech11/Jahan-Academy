import assert from "node:assert/strict";
import test from "node:test";
import { newPasswordError } from "../lib/password-policy.ts";
import { loginPayload } from "../lib/admin-login.ts";

test("password length counts Unicode code points without truncating or trimming", () => {
  for (const password of ["🌏".repeat(15), "🌏".repeat(128), "یک عبارت فارسی طولانی", "  unique phrase  "])
    assert.equal(newPasswordError(password), "");
  for (const password of ["🌏".repeat(14), "🌏".repeat(129)])
    assert.notEqual(newPasswordError(password), "");
  const password = "🌏".repeat(128);
  assert.equal(loginPayload({ username: "staff", password }, { environment: "production" }).password, password);
  assert.equal(loginPayload({ username: "staff", password: "old" }, { environment: "production" }).password, "old");
});
