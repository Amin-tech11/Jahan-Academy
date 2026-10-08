import { createRequestKey } from "../lib/request-key.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../components/services-consultation-form.tsx", import.meta.url), "utf8");

test("services consultation supplies the public API contract and keeps its retry key", async () => {
  const calls = [];
  const module = { exports: {} };
  const ref = { current: null };
  const fields = { firstName: " API ", lastName: " Test ", mobile: "+12025550197", occupation: "Other", privacyConsent: "on", contactConsent: "on" };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, Date, crypto: { randomUUID: () => "services-retry-key" },
    FormData: class { get(key) { return fields[key] ?? ""; } },
    require(name) {
      if (name === "./site-select") return { default: "select" };
      if (name === "@/lib/request-key") return { createRequestKey: () => createRequestKey({ getRandomValues: crypto.getRandomValues.bind(crypto) }) };
      if (name === "react") return { useId: () => "services", useRef: () => ref, useState: value => [value, () => {}] };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/link") return { default: () => null };
      if (name === "./consultation-success") return { ConsultationSuccess: () => null };
      if (name === "./consultation-form-heading") return { ConsultationFormHeading: () => null };
      if (name === "@/lib/consultation") return { normalizeMobile: value => value };
      if (name === "@/lib/api-client") return { apiRequest: async (path, options) => { calls.push({ path, options }); throw new Error("network interruption"); } };
      throw new Error(name);
    },
  });
  const form = module.exports.ServicesConsultationForm({ locale: "en" });
  const event = { preventDefault() {}, currentTarget: { elements: { namedItem: () => ({ setCustomValidity() {} }) }, reportValidity: () => true } };
  await form.props.onSubmit(event);
  await form.props.onSubmit(event);
  assert.equal(calls.length, 2);
  const { path, options } = calls[0];
  assert.equal(path, "/consultation-requests");
  assert.equal(options.body.firstName, "API");
  assert.equal(options.body.intakeTerm, "unknown");
  assert.equal(options.body.startYear, new Date().getUTCFullYear());
  assert.ok(options.body.desiredCountryText);
  assert.equal(options.body.source.pageUrl, "/en/services");
  assert.equal(options.body.privacyConsent, true);
  assert.equal(options.body.contactConsent, true);
  assert.equal(options.headers["Idempotency-Key"], calls[1].options.headers["Idempotency-Key"]);
});
