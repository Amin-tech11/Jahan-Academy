import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../components/universities-navigation.tsx", import.meta.url), "utf8");

test("guide follows scrolling in both directions, header resizing and hash navigation, then cleans up", () => {
  const effects = [], events = new Map(), observers = [];
  let active, queued, headerHeight = 80;
  const sections = [600, 1200, 1800].map(top => ({ top, height: 600, getBoundingClientRect() { return { top: this.top, bottom: this.top + this.height }; } }));
  const header = { getBoundingClientRect: () => ({ height: headerHeight, bottom: headerHeight }) };
  const nav = { closest: () => ({ querySelector: () => header }), getBoundingClientRect: () => ({ height: 120, bottom: headerHeight + 120 }), parentElement: { style: { setProperty() {}, removeProperty() {} } } };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports,
    document: { getElementById: id => sections[Number(id)] },
    window: { innerHeight: 950, requestAnimationFrame: fn => { queued = fn; return 1; }, cancelAnimationFrame: () => { queued = undefined; }, addEventListener: (name, fn) => events.set(name, fn), removeEventListener: name => events.delete(name) },
    ResizeObserver: class { constructor(fn) { this.fn = fn; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    require(name) {
      if (name === "react") return { useRef: () => ({ current: nav }), useState: initial => { active = initial; return [active, value => { active = value; }]; }, useEffect: fn => effects.push(fn) };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name.endsWith(".css")) return { default: {} };
      throw new Error(name);
    },
  });
  module.exports.UniversitiesNavigation({ title: "Guide", items: sections.map((_, i) => ({ id: String(i), label: String(i) })) });
  const cleanups = effects.map(fn => fn());
  const flush = name => { events.get(name)(); const fn = queued; queued = undefined; fn(); };
  assert.equal(active, "0");
  sections[0].top = -800; sections[1].top = 220;
  flush("scroll"); assert.equal(active, "1");
  sections[1].top = -500; sections[2].top = 280;
  flush("hashchange"); assert.equal(active, "2");
  // Regression: next heading is visible 80px below the bar, previous section is hidden.
  assert.ok(sections[2].top > headerHeight + 120 + 24);
  sections[0].top = 220; sections[1].top = 820; sections[2].top = 1420;
  flush("scroll"); assert.equal(active, "0");
  sections[0].top = -500; sections[1].top = 250; headerHeight = 120;
  flush("resize"); assert.equal(active, "1");
  cleanups.forEach(fn => fn());
  assert.equal(events.size, 0);
  assert.ok(observers.every(observer => observer.disconnected));
});
