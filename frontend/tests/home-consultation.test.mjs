import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/home-consultation.tsx", import.meta.url), "utf8");
function setup(mobile, fail = false, sourcePage) {
  const calls = [];
  const ref = { current: null };
  const module = { exports: {} };
  class ApiError extends Error {}
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, Date, crypto: { randomUUID: () => "same-retry-key" },
    FormData: class { get(key) { return { firstName: " Ali ", lastName: " Ahmadi ", mobile, occupation: "Student", contactTime: "Morning", privacyConsent: "on", contactConsent: "on" }[key]; } },
    require(name) {
      if (name === "react") return { useId: () => "form", useRef: () => ref, useState: (value) => [value, () => {}] };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/link") return { default: () => null };
      if (name === "@/lib/consultation") return { normalizeMobile: (value) => value === "09120000000" ? "+989120000000" : null };
      if (name === "@/lib/api-client") return { ApiError, apiRequest: async (path, options) => { calls.push({ path, options }); if (fail) throw new Error("network"); return { data: { reference: "R1" } }; } };
      throw new Error(name);
    },
  });
  const form = module.exports.HomeConsultation({ locale: "en", sourcePage });
  return { calls, submit: () => form.props.onSubmit({ preventDefault() {}, currentTarget: {} }), form };
}
test("invalid mobile prevents consultation submission", async () => {
  const app = setup("invalid");
  await app.submit();
  assert.equal(app.calls.length, 0);
});

test("university consultation records its own source page", async () => {
  const app = setup("09120000000", false, "/en/universities#university-consultation");
  await app.submit();
  assert.equal(app.calls[0].options.body.source.pageUrl, "/en/universities#university-consultation");
});
test("home form sends normalized contact details, consents and preferred time with stable retry key", async () => {
  const app = setup("09120000000", true);
  await app.submit(); await app.submit();
  assert.equal(app.calls.length, 2);
  const { path, options } = app.calls[0];
  assert.equal(path, "/consultation-requests");
  assert.equal(options.body.firstName, "Ali");
  assert.equal(options.body.mobile, "+989120000000");
  assert.equal(options.body.privacyConsent, true);
  assert.equal(options.body.contactConsent, true);
  assert.match(options.body.message, /Morning/);
  assert.equal(options.body.source.pageUrl, "/en/#home-consultation");
  assert.equal(options.headers["Idempotency-Key"], app.calls[1].options.headers["Idempotency-Key"]);
  const consents = app.form.props.children.filter((child) => child?.type === "label");
  assert.equal(consents.length, 2);
  assert.equal(consents.every((label) => label.props.children[0].props.required), true);
});
