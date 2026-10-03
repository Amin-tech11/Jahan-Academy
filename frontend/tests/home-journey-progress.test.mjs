import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/home-journey-progress.tsx", import.meta.url), "utf8");
function setup(top = 700, mobile = false) {
  const steps = [0, 1, 2].map((index) => {
    const entry = { top: top + index * 400, dataset: {} };
    const path = {
      getTotalLength: () => 100,
      getPointAtLength: (n) => ({ x: mobile ? 50 : 50 + 12 * Math.sin(n * Math.PI / 50), y: n }),
      getScreenCTM: () => ({ a: index % 2 ? -1 : 1, b: 0, c: 0, d: 4, e: mobile ? (index % 2 ? 74 : -26) : (index % 2 ? 550 : 450), f: entry.top }),
    };
    entry.querySelector = (selector) => selector.endsWith(" path") ? path
      : selector === ".home-process__rail" ? { getBoundingClientRect: () => ({ top: entry.top, bottom: entry.top + 400 }) }
      : { getBoundingClientRect: () => ({ top: entry.top + (mobile ? 48 : 200) - 24, bottom: entry.top + (mobile ? 48 : 200) + 24, height: 48 }) };
    return entry;
  });
  const dot = { style: {}, dataset: {} };
  const list = { querySelectorAll: () => steps, parentElement: { getBoundingClientRect: () => ({ top: steps[0].top, left: 0 }) } };
  const events = new Map();
  let effect, scheduled, observer;
  let refs = 0;
  const window = {
    innerHeight: 1000,
    requestAnimationFrame(fn) { scheduled = fn; return 1; },
    cancelAnimationFrame() { scheduled = undefined; },
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name) { events.delete(name); },
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, window,
    ResizeObserver: class {
      constructor(fn) { this.fn = fn; this.disconnected = false; observer = this; }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
    require(name) {
      if (name === "react") return { useEffect(fn) { effect = fn; }, useRef() { return { current: refs++ === 0 ? list : dot }; } };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      throw new Error(name);
    },
  });
  const tree = module.exports.HomeJourneyProgress({ children: null });
  const cleanup = effect();
  const flush = () => { const fn = scheduled; scheduled = undefined; fn?.(); };
  return { steps, dot, events, window, cleanup, tree, observer, point: module.exports.journeyPoint, flush,
    shift(delta) { steps.forEach((step) => { step.top += delta; }); events.get("scroll")(); flush(); },
    coordinates() { return dot.style.transform.match(/translate3d\(([-.\d]+)px, ([-.\d]+)px/).slice(1).map(Number); },
  };
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .02, `${actual} != ${expected}`);

test("dot begins at the rail start and stays within the path at either end", () => {
  const app = setup();
  near(app.coordinates()[1], 0);
  assert.ok(app.steps.every((step) => !step.dataset.active));
  app.shift(-2500);
  near(app.coordinates()[1], 1200);
  assert.ok(app.steps.every((step) => !step.dataset.active));
  app.cleanup();
});

test("scrolling both directions activates only the number the dot reaches", () => {
  const app = setup(300);
  assert.equal(app.steps[0].dataset.active, "true");
  app.shift(-400);
  assert.equal(app.steps[0].dataset.active, undefined);
  assert.equal(app.steps[1].dataset.active, "true");
  app.shift(400);
  assert.equal(app.steps[0].dataset.active, "true");
  assert.equal(app.steps[1].dataset.active, undefined);
  app.shift(-100);
  assert.ok(app.steps.every((step) => !step.dataset.active));
  app.cleanup();
});

test("point follows the rendered curve including alternating mirrored segments", () => {
  const app = setup(400);
  near(app.coordinates()[0], 512);
  near(app.coordinates()[1], 100);
  app.shift(-400);
  near(app.coordinates()[0], 488);
  near(app.coordinates()[1], 500);
  app.cleanup();
});

test("mobile uses the straight rail and its actual number position", () => {
  const app = setup(452, true);
  near(app.coordinates()[0], 24);
  assert.equal(app.steps[0].dataset.active, "true");
  app.shift(-400);
  near(app.coordinates()[0], 24);
  assert.equal(app.steps[1].dataset.active, "true");
  app.cleanup();
});

test("resize and layout changes reposition the dot; unmount cancels all work", () => {
  const app = setup(400);
  app.window.innerHeight = 1200;
  app.events.get("resize")(); app.flush();
  near(app.coordinates()[1], 200);
  app.steps.forEach((step) => { step.top += 100; });
  app.observer.fn(); app.flush();
  near(app.coordinates()[1], 100);
  app.events.get("scroll")();
  app.cleanup();
  assert.equal(app.events.size, 0);
  assert.equal(app.observer.disconnected, true);
  const before = app.dot.style.transform;
  app.flush();
  assert.equal(app.dot.style.transform, before);
});

test("decorative dot is outside the semantic list and hidden from assistive technology", () => {
  const app = setup();
  const [list, dot] = app.tree.props.children;
  assert.equal(list.type, "ol");
  assert.equal(dot.type, "span");
  assert.equal(dot.props["aria-hidden"], "true");
  assert.equal(app.point({ getScreenCTM: () => null }, 0), null);
  app.cleanup();
});

test("dot fully disappears at a numbered circle and returns beyond it in both scroll directions", () => {
  for (const mobile of [false, true]) {
    const app = setup(mobile ? 492 : 340, mobile);
    assert.equal(app.dot.style.opacity, "1");
    app.shift(-15);
    assert.equal(app.dot.style.opacity, "0");
    app.shift(-25);
    assert.equal(app.dot.style.opacity, "0");
    assert.equal(app.steps[0].dataset.active, "true");
    app.shift(-40);
    assert.equal(app.dot.style.opacity, "1");
    assert.equal(app.steps[0].dataset.active, undefined);
    app.shift(40);
    assert.equal(app.dot.style.opacity, "0");
    app.shift(40);
    assert.equal(app.dot.style.opacity, "1");
    app.cleanup();
  }
});
