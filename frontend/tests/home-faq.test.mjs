import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/home-faq.tsx", import.meta.url), "utf8");
test("FAQ toggles one answer at a time and exposes accessible state", () => {
  let state = null;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports,
    require(name) {
      if (name === "react") return { useId: () => "faq", useState: () => [state, (update) => { state = update(state); }] };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      throw new Error(name);
    },
  });
  const render = () => module.exports.HomeFaq({ items: [{ question: "First?", answer: "One" }, { question: "Second?", answer: "Two" }] }).props.children;
  const button = (row) => row.props.children[0].props.children.props;
  const answer = (row) => row.props.children[1].props;
  let rows = render();
  assert.equal(button(rows[0])["aria-expanded"], false);
  assert.equal(answer(rows[0]).inert, true);
  button(rows[0]).onClick();
  rows = render();
  assert.equal(button(rows[0])["aria-expanded"], true);
  assert.equal(answer(rows[0]).inert, false);
  assert.equal(button(rows[0])["aria-controls"], answer(rows[0]).id);
  button(rows[1]).onClick();
  rows = render();
  assert.equal(answer(rows[0]).inert, true);
  assert.equal(answer(rows[1])["aria-hidden"], false);
  button(rows[1]).onClick();
  assert.equal(render().every((row) => answer(row).inert), true);
});
