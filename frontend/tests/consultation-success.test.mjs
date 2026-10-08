import { createRequestKey } from "../lib/request-key.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const reference = "JA-CONSULTATION123";
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
}
function load(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, ...globals,
    require(name) {
      if (name === "./site-select") return { default: "select" };
      if (name === "@/lib/request-key") return { createRequestKey };
      if (name === "react/jsx-runtime") return jsx;
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return module.exports;
}
for (const fails of [false, true]) test(`consultation receipt handles clipboard ${fails ? "denial" : "success"}`, async () => {
  let status = "idle";
  const writes = [];
  const { ConsultationSuccess } = load("consultation-success", {
    react: { useState: () => [status, value => { status = value; }] },
    "./consultation-success.module.css": { default: {} },
  }, { navigator: { clipboard: { writeText: async value => { if (fails) throw new Error("Denied"); writes.push(value); } } } });
  const render = () => nodes(ConsultationSuccess({ locale: "fa", reference }));
  const result = render();
  assert.ok(result.some(node => node.type === "p" && node.props.children.startsWith("درخواست مشاوره شما با موفقیت دریافت شد.")));
  assert.ok(!result.some(node => node.type === "a"));
  await result.find(node => node.type === "button").props.onClick();
  assert.deepEqual(writes, fails ? [] : [reference]);
  assert.equal(status, fails ? "error" : "copied");
  assert.ok(render().some(node => node.type === "strong" && node.props.children === reference));
  if (fails) assert.ok(render().some(node => node.props.role === "alert"));
  else assert.ok(render().find(node => node.type === "button").props.children.includes("کپی شد"));
});

for (const [file, exportName, state, wrapper] of [
  ["home-consultation", "HomeConsultation", ["success", "", reference], "home-closing__card"],
  ["services-consultation-form", "ServicesConsultationForm", [false, "", { reference, duplicate: true }], null],
  ["consultation-form", "ConsultationForm", ["success", { reference, duplicate: true }, ""], "consultation-form"],
  ["consultation-request-form", "ConsultationForm", [{}, {}, "success", "", { reference, duplicate: true }, [], false], "consultation-request-form"],
]) test(`${file} preserves its container and passes the API reference to the common receipt`, () => {
  let cursor = 0;
  const Receipt = () => null;
  const module = load(file, {
    react: { useState: () => [state[cursor++], () => {}], useRef: () => ({ current: null }), useId: () => "test", useEffect: () => {} },
    "next/link": { default: "a" },
    "./consultation-success": { ConsultationSuccess: Receipt },
    "./consultation-form-heading": { ConsultationFormHeading: () => null },
    "@/components/ui": {},
    "@/lib/api-client": {},
    "@/lib/consultation": { sourcePageUrl: () => "/fa/contact" },
    "@/lib/site-content": { siteCopy: { fa: {} } },
  });
  const rendered = module[exportName]({ locale: "fa", source: "/fa/contact" });
  if (wrapper) assert.equal(rendered.props.className, wrapper);
  const receipt = nodes(rendered).find(node => node.type === Receipt);
  assert.equal(receipt.props.reference, reference);
  assert.equal(receipt.props.locale, "fa");
  if (file !== "home-consultation") assert.equal(receipt.props.duplicate, true);
});
