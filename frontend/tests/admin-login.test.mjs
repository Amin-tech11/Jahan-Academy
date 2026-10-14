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
test("production names go to the backend without resolving the development alias", () => {
  for (const environment of ["production", "test", undefined])
    assert.deepEqual(
      loginPayload(
        { username: "ExampleAdmin", password: "x" },
        { ...configuration, environment },
      ),
      { username: "ExampleAdmin", password: "x" },
    );
});
test("names require backend authentication and existing email login remains available", () => {
  assert.deepEqual(
    loginPayload({ username: "SomeoneElse", password: "x" }, configuration),
    { username: "SomeoneElse", password: "x" },
  );
  assert.deepEqual(
    loginPayload(
      { username: "staff@example.com", password: "keep spaces " },
      { environment: "production" },
    ),
    { email: "staff@example.com", password: "keep spaces " },
  );
});
