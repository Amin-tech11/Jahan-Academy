import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../components/about-navigation.tsx", import.meta.url), "utf8");
const box = (top, bottom, left = 0, right = 1000) => ({ top, bottom, left, right });
function setup(rects, { height = 900, width = 1200, navBottom = 200 } = {}) {
  const ids = ["story", "purpose", "values", "journey"], events = new Map();
  const header = { getBoundingClientRect: () => ({ bottom: 80 }) }, navBox = { bottom: navBottom };
  const nav = { getBoundingClientRect: () => navBox, closest: () => ({ querySelector: () => header }) };
  const elements = rects.map((_, i) => ({ getBoundingClientRect: () => rects[i] }));
  let active = "story", effect, scheduled, observer;
  const window = { innerWidth: width, innerHeight: height, addEventListener: (event, cb) => events.set(event, cb), removeEventListener: event => events.delete(event) };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, window,
    requestAnimationFrame(cb) { scheduled = cb; return 1; },
    cancelAnimationFrame() { scheduled = undefined; },
    ResizeObserver: class {
      constructor(cb) { this.callback = cb; observer = this; }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
    document: { getElementById: id => elements[ids.indexOf(id)] ?? null },
    require(name) {
      if (name === "react") return { useRef: () => ({ current: nav }), useState: () => [active, value => { active = value; }], useEffect: cb => { effect = cb; } };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name.endsWith(".css")) return { default: {} };
      throw new Error(name);
    },
  });
  module.exports.AboutNavigation({ labels: ids, title: "About" });
  const cleanup = effect();
  return { events, window, navBox, observer, cleanup, get active() { return active; }, get scheduled() { return scheduled; }, flush() { const cb = scheduled; scheduled = undefined; cb?.(); } };
}

test("largest visible section wins before its heading crosses the old arrival marker", () => {
  const rects = [box(-200, 350), box(400, 1000), box(1050, 1600), box(1650, 2200)];
  const app = setup(rects);
  assert.equal(app.active, "purpose");
  rects[0] = box(200, 700); rects[1] = box(750, 1300);
  app.events.get("scroll")(); app.flush();
  assert.equal(app.active, "story");
  app.cleanup();
});

test("sticky bars and horizontal clipping are excluded from visible area", () => {
  const app = setup([box(-200, 500), box(510, 760), box(770, 1500, 0, 500), box(1700, 2000)], { navBottom: 300 });
  assert.equal(app.active, "purpose");
  app.cleanup();
});

test("mobile viewport, navigation height and layout changes recompute the winner", () => {
  const app = setup([box(100, 440), box(450, 1200)]);
  assert.equal(app.active, "purpose");
  app.window.innerWidth = 390; app.window.innerHeight = 650;
  app.events.get("resize")(); app.flush();
  assert.equal(app.active, "story");
  app.navBox.bottom = 350;
  app.observer.callback(); app.flush();
  assert.equal(app.active, "purpose");
  app.events.get("hashchange")();
  assert.ok(app.scheduled);
  app.cleanup();
  assert.equal(app.scheduled, undefined);
  assert.equal(app.events.size, 0);
  assert.equal(app.observer.disconnected, true);
});

test("unlisted FAQ and offscreen content do not reset the last selection", () => {
  const rects = [box(-2000, -1500), box(-1400, -1000), box(-900, -500), box(210, 800)];
  const app = setup(rects);
  assert.equal(app.active, "journey");
  rects[3] = box(-700, -100);
  app.events.get("scroll")(); app.flush();
  assert.equal(app.active, "journey");
  app.cleanup();
});
