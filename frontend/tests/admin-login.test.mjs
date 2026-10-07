import assert from "node:assert/strict";
import test from "node:test";
import { loginPayload } from "../lib/admin-login.ts";

const configuration = {
  environment: "development",
  username: "ExampleAdmin",
  email: "local-admin@example.com",
};
test("local username resolves server-side without changing or validating the password itself", () => {
  assert.deepEqual(
    loginPayload(
      { username: " exampleADMIN ", password: "user-supplied-password" },
      configuration,
    ),
    { email: "local-admin@example.com", password: "user-supplied-password" },
  );
});
test("both username and password are required by the server adapter", () => {
  for (const input of [
    null,
    {},
    { username: "ExampleAdmin" },
    { username: "", password: "x" },
    { username: "   ", password: "x" },
    { username: "ExampleAdmin", password: "" },
    { username: 1, password: "x" },
    { username: "ExampleAdmin", password: "x".repeat(129) },
  ])
    assert.equal(loginPayload(input, configuration), null);
});
test("development alias cannot authenticate in production or test environments", () => {
  for (const environment of ["production", "test", undefined])
    assert.equal(
      loginPayload(
        { username: "ExampleAdmin", password: "x" },
        { ...configuration, environment },
      ),
      null,
    );
});
test("unknown names do not resolve and existing email login remains available", () => {
  assert.equal(
    loginPayload({ username: "SomeoneElse", password: "x" }, configuration),
    null,
  );
  assert.deepEqual(
    loginPayload(
      { username: "staff@example.com", password: "keep spaces " },
      { environment: "production" },
    ),
    { email: "staff@example.com", password: "keep spaces " },
  );
});
