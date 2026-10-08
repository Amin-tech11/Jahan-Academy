import { createRequestKey } from "../lib/request-key.ts";
import { isValidEmail, normalizeMobile } from "../lib/consultation.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../components/assessment-form.tsx", import.meta.url), "utf8");
const reference = "JA-RECEIPT12345678";
function setup({ copyFails = false, submitFails = false, email = "test@example.com", mobile = "09120000000" } = {}) {
  const state = [], refs = [], copied = [], requests = [];
  let cursor = 0, refCursor = 0;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, Date,
    crypto: { randomUUID: () => "receipt-test-key" },
    navigator: { clipboard: { writeText: async value => { if (copyFails) throw new Error("Denied"); copied.push(value); } } },
    FormData: class { get(key) { return { fullName: "Test Applicant", mobile, email, privacyConsent: "on", contactConsent: "on" }[key] ?? ""; } },
    require(name) {
      if (name === "@/lib/request-key") return { createRequestKey: () => createRequestKey({ getRandomValues: crypto.getRandomValues.bind(crypto) }) };
      if (name === "react") return {
        useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
        useRef: initial => refs[refCursor++] ??= { current: initial },
      };
      if (name === "react/jsx-runtime") return { Fragment: "fragment", jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/link") return { default: "a" };
      if (name === "@/lib/consultation") return { normalizeMobile, isValidEmail, consultationPayload: fields => fields };
      if (name === "@/lib/site-content") return { siteCopy: { fa: { thankYou: "Received", trackingCode: "کد پیگیری", formError: "Try again" } } };
      if (name === "@/lib/api-client") return { ApiError: class extends Error {}, apiRequest: async (url, options) => { requests.push(options.body); if (submitFails) throw new Error("Offline"); return { data: { reference, duplicate: false } }; } };
      throw new Error(name);
    },
  });
  return { copied, requests, render() { cursor = refCursor = 0; return module.exports.AssessmentForm({ locale: "fa", source: "/fa/consultation" }); } };
}
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
}
async function submit(app) {
  await nodes(app.render()).find(node => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: {} });
}
test("successful assessment replaces the introduction and copies only the reference", async () => {
  const app = setup();
  assert.ok(nodes(app.render()).some(node => node.props.className === "assessment-page__form-heading"));
  await submit(app);
  const result = nodes(app.render());
  assert.ok(!result.some(node => node.props.className === "assessment-page__form-heading" || node.type === "form"));
  assert.ok(result.some(node => node.type === "p" && node.props.children === "فرم ارزیابی اولیه شما با موفقیت دریافت شد. تیم ما اطلاعات شما را بررسی میکنند و با شما تماس میگیرند."));
  await result.find(node => node.type === "button").props.onClick();
  assert.deepEqual(app.copied, [reference]);
  assert.ok(nodes(app.render()).find(node => node.type === "button").props.children.includes("کپی شد"));
});
test("clipboard rejection keeps the reference visible and explains manual copying", async () => {
  const app = setup({ copyFails: true });
  await submit(app);
  await nodes(app.render()).find(node => node.type === "button").props.onClick();
  assert.ok(nodes(app.render()).some(node => node.props.role === "alert"));
  assert.ok(nodes(app.render()).some(node => node.type === "strong" && node.props.children === reference));
  assert.deepEqual(app.copied, []);
});
test("failed submission keeps the introduction and form available for retry", async () => {
  const app = setup({ submitFails: true });
  await submit(app);
  assert.ok(nodes(app.render()).some(node => node.type === "form"));
  assert.ok(nodes(app.render()).some(node => node.props.className === "assessment-page__form-heading"));
});

test("invalid email and mobile never send an assessment request", async () => {
  for (const fields of [{ email: "name@gmail" }, { email: "first..last@gmail.com" }, { email: "" }, { mobile: "02112345678" }, { mobile: "0912abc4567" }]) {
    const app = setup(fields);
    await submit(app);
    assert.equal(app.requests.length, 0);
    assert.ok(nodes(app.render()).some(node => node.props.role === "alert"));
  }
});

test("valid Persian mobile and email are normalized before submission", async () => {
  const app = setup({ mobile: "۰۹۱۲ ۱۲۳ ۴۵۶۷", email: " student+study@gmail.com " });
  await submit(app);
  assert.equal(app.requests[0].mobile, "+989121234567");
  assert.equal(app.requests[0].email, "student+study@gmail.com");
});
