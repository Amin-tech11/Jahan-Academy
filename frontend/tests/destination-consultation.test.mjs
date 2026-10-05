import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { normalizeMobile } from "../lib/consultation.ts";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/destination-consultation.tsx", import.meta.url), "utf8");
function setup({ locale = "en", values = {}, fail = false, pending = false } = {}) {
  const calls = [], refs = [], states = [];
  let refIndex = 0, stateIndex = 0, release;
  const data = { firstName: " Ali ", lastName: " Ahmadi ", mobile: "۰۹۱۲۰۰۰۰۰۰۰", occupation: "Student", contactTime: "Morning", privacyConsent: "on", contactConsent: "on", ...values };
  const module = { exports: {} };
  let key = 0;
  class ApiError extends Error {}
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, Date, crypto: { randomUUID: () => `key-${++key}` },
    FormData: class { get(key) { return data[key] ?? null; } },
    require(name) {
      if (name === "react") return {
        useId: () => "form",
        useRef: value => refs[refIndex++] ??= { current: value },
        useState: value => { const i = stateIndex++; states[i] ??= value; return [states[i], next => { states[i] = next; }]; },
      };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/link") return { default: () => null };
      if (name.endsWith(".module.css")) return { default: {} };
      if (name === "@/lib/consultation") return { normalizeMobile };
      if (name === "@/lib/api-client") return { ApiError, apiRequest: async (path, options) => {
        calls.push({ path, options });
        if (pending) await new Promise(resolve => { release = resolve; });
        if (fail) throw new Error("network");
        return { data: { reference: "R1" } };
      } };
      throw new Error(name);
    },
  });
  const render = () => { refIndex = 0; stateIndex = 0; return module.exports.DestinationConsultation({ locale, destination: { slug: "germany", name: { fa: "آلمان", en: "Germany" } } }); };
  const form = render();
  return { calls, data, states, render, release: () => release(), submit: (valid = true) => form.props.onSubmit({ preventDefault() {}, currentTarget: { reportValidity: () => valid } }) };
}
test("destination form blocks invalid input, blank names and missing consents", async () => {
  for (const values of [{ mobile: "invalid" }, { firstName: "   " }, { occupation: "" }, { privacyConsent: null }, { contactConsent: null }]) {
    const app = setup({ values }); await app.submit(); assert.equal(app.calls.length, 0);
  }
  const app = setup(); await app.submit(false); assert.equal(app.calls.length, 0);
});
test("destination form submits normalized details and current country/source in both languages", async () => {
  for (const locale of ["fa", "en"]) {
    const app = setup({ locale }); await app.submit();
    const { path, options } = app.calls[0];
    assert.equal(path, "/consultation-requests");
    assert.equal(options.body.firstName, "Ali");
    assert.equal(options.body.mobile, "+989120000000");
    assert.equal(options.body.desiredCountryText, locale === "fa" ? "آلمان" : "Germany");
    assert.equal(options.body.source.pageUrl, `/${locale}/countries/germany#destination-consultation`);
    assert.equal(options.body.privacyConsent, true); assert.equal(options.body.contactConsent, true);
    assert.match(options.body.message, /Morning/);
    assert.equal(app.render().props.role, "status"); assert.equal(app.states[2], "R1");
  }
});
test("failed destination requests preserve retry keys, with a new key for changed details", async () => {
  const app = setup({ fail: true }); await app.submit(); await app.submit();
  assert.equal(app.states[0], "error");
  assert.equal(app.calls[0].options.headers["Idempotency-Key"], app.calls[1].options.headers["Idempotency-Key"]);
  app.data.contactTime = "Evening"; await app.submit();
  assert.notEqual(app.calls[1].options.headers["Idempotency-Key"], app.calls[2].options.headers["Idempotency-Key"]);
});
test("destination form prevents concurrent duplicate submissions", async () => {
  const app = setup({ pending: true }); const first = app.submit(); await app.submit();
  assert.equal(app.calls.length, 1); app.release(); await first;
});
