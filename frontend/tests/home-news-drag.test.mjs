import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/home-news-ticker.tsx", import.meta.url), "utf8");
function setup() {
  const animation = { currentTime: 15000, effect: { getComputedTiming: () => ({ duration: 45000 }) } };
  const viewport = { dataset: {}, scrollLeft: 0, setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} };
  const track = { scrollWidth: 2000, getAnimations: () => [animation] };
  let refIndex = 0;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports,
    require(name) {
      if (name === "react") return { useRef: (value) => ({ current: [viewport, track][refIndex++] ?? value }) };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "next/image" || name === "next/link") return { default: () => null };
      throw new Error(name);
    },
  });
  const output = module.exports.HomeNewsTicker({ items: [], locale: "fa" });
  const handlers = output.props.children.props;
  const event = (x, y = 0) => ({ isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y, currentTarget: viewport, preventDefault() {} });
  return { animation, viewport, handlers, event };
}
test("drag moves cards both ways and prevents article navigation after dragging", () => {
  const app = setup();
  app.handlers.onPointerDown(app.event(100));
  app.handlers.onPointerMove(app.event(200));
  assert.equal(app.animation.currentTime, 19500);
  assert.equal(app.viewport.dataset.dragging, "true");
  app.handlers.onPointerMove(app.event(50));
  assert.equal(app.animation.currentTime, 12750);
  app.handlers.onPointerUp(app.event(50));
  assert.equal(app.viewport.dataset.dragging, undefined);
  let prevented = false;
  app.handlers.onClickCapture({ preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, true);
});
test("ordinary clicks stay navigable and vertical touch gestures leave page scrolling available", () => {
  const app = setup();
  app.handlers.onPointerDown(app.event(100));
  app.handlers.onPointerUp(app.event(100));
  let prevented = false;
  app.handlers.onClickCapture({ preventDefault() { prevented = true; }, stopPropagation() {} });
  assert.equal(prevented, false);
  app.handlers.onPointerDown(app.event(100));
  app.handlers.onPointerMove(app.event(102, 40));
  assert.equal(app.viewport.dataset.dragging, undefined);
  assert.equal(app.animation.currentTime, 15000);
});
