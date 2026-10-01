import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/home-journey-progress.tsx", import.meta.url), "utf8");

function setup(positions) {
  const steps = positions.map((top) => ({
    top, dataset: {},
    querySelector() { return { getBoundingClientRect: () => ({ top: this.top, bottom: this.top + 100 }) }; },
  }));
  const events = new Map();
  let effect;
  let scheduled;
  let cleanup;
  const window = {
    innerHeight: 1000,
    requestAnimationFrame(callback) { scheduled = callback; return 1; },
    cancelAnimationFrame() { scheduled = undefined; },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, window,
    require(name) {
      if (name === "react") return {
        useEffect(callback) { effect = callback; },
        useRef() { return { current: { querySelectorAll: () => steps } }; },
      };
      if (name === "react/jsx-runtime") return { jsx: () => null };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  module.exports.HomeJourneyProgress({ children: null });
  cleanup = effect();
  return { steps, events, window, cleanup, flush() { const callback = scheduled; scheduled = undefined; callback?.(); } };
}

test("journey markers stay unreached until their description enters the arrival area", () => {
  const app = setup([700, 1200]);
  assert.equal(app.steps[0].dataset.active, undefined);
  assert.equal(app.steps[1].dataset.active, undefined);
  app.steps[0].top = 600;
  app.events.get("scroll")();
  app.flush();
  assert.equal(app.steps[0].dataset.active, "true");
  assert.equal(app.steps[1].dataset.active, undefined);
  app.cleanup();
});

test("only the current step is active and scrolling back reactivates it", () => {
  const app = setup([-100, 400, 900]);
  assert.equal(app.steps[0].dataset.active, undefined);
  assert.equal(app.steps[1].dataset.active, "true");
  app.steps[0].top = 400;
  app.steps[1].top = 900;
  app.events.get("scroll")();
  app.flush();
  assert.equal(app.steps[0].dataset.active, "true");
  assert.equal(app.steps[1].dataset.active, undefined);
  assert.equal(app.steps[2].dataset.active, undefined);
  app.cleanup();
});

test("viewport resizing updates arrival and unmount removes listeners", () => {
  const app = setup([700]);
  app.window.innerHeight = 1200;
  app.events.get("resize")();
  app.flush();
  assert.equal(app.steps[0].dataset.active, "true");
  app.cleanup();
  assert.equal(app.events.size, 0);
});

test("all circles reset when the journey is outside the viewport", () => {
  const app = setup([400, 900]);
  assert.equal(app.steps[0].dataset.active, "true");
  app.steps[0].top = -500;
  app.steps[1].top = -200;
  app.events.get("scroll")();
  app.flush();
  assert.ok(app.steps.every((step) => step.dataset.active === undefined));
  app.cleanup();
});
