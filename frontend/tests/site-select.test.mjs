import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const source = readFileSync(new URL("../components/site-select.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, require }, { filename: "site-select.js" });
const SiteSelect = module.exports.default;
const option = (value, label, disabled = false) => React.createElement("option", { value, disabled }, label);

test("custom trigger exposes selected label and native control retains form and validation attributes", () => {
  const html = renderToStaticMarkup(React.createElement(SiteSelect, { id: "gender", name: "gender", required: true, defaultValue: "female", "aria-label": "جنسیت", "aria-describedby": "hint" }, option("", "انتخاب کنید", true), option("female", "زن"), option("male", "مرد")));
  assert.match(html, /type="button"/);
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-label="جنسیت"/);
  assert.match(html, /aria-describedby="hint"/);
  assert.match(html, /<span>زن<\/span>/);
  assert.match(html, /name="gender"/);
  assert.match(html, /required=""/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /value="female" selected=""/);
});

test("controlled numeric values, nested option groups and disabled choices render consistently", () => {
  const html = renderToStaticMarkup(React.createElement(SiteSelect, { value: 2027, disabled: true, onChange() {} }, React.createElement("optgroup", { label: "سال" }, option(2026, "۲۰۲۶"), option(2027, "۲۰۲۷"))));
  assert.match(html, /<span>۲۰۲۷<\/span>/);
  assert.match(html, /disabled=""/);
  assert.match(html, /value="2027" selected=""/);
});
