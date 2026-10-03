import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/services-motion.tsx", import.meta.url), "utf8");

function setup(tops, reduced = false) {
  const sections = tops.map((top) => ({
    top, dataset: {}, values: {}, focused: false,
    getBoundingClientRect() { return { top: this.top }; },
    contains() { return this.focused; },
    get style() { return {
      setProperty: (key, value) => { this.values[key] = value; },
      removeProperty: (key) => { delete this.values[key]; },
    }; },
  }));
  const events = new Map();
  const focusEvents = new Map();
  const mediaEvents = new Map();
  const media = { matches: reduced, addEventListener: (key, cb) => mediaEvents.set(key, cb), removeEventListener: (key) => mediaEvents.delete(key) };
  const container = { querySelectorAll: () => sections, addEventListener: (key, cb) => focusEvents.set(key, cb), removeEventListener: (key) => focusEvents.delete(key) };
  let effect, scheduled, disconnected = false;
  const window = {
    innerHeight: 1000, matchMedia: () => media,
    requestAnimationFrame: (cb) => { scheduled = cb; return 1; },
    cancelAnimationFrame: () => { scheduled = undefined; },
    addEventListener: (key, cb) => events.set(key, cb),
    removeEventListener: (key) => events.delete(key),
  };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, window, document: { activeElement: null },
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
    require(name) {
      if (name === "react") return { useEffect: (cb) => { effect = cb; }, useRef: () => ({ current: container }) };
      if (name === "react/jsx-runtime") return { jsx: () => null };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  module.exports.ServicesMotion({ children: null });
  const cleanup = effect();
  return { sections, window, events, focusEvents, media, mediaEvents, cleanup,
    progress: (index) => Number(sections[index].values["--service-progress"]),
    flush() { const cb = scheduled; scheduled = undefined; cb?.(); },
    get disconnected() { return disconnected; },
  };
}

test("service motion follows scroll, reverses below the viewport, and replays", () => {
  const app = setup([1000, 1600]);
  assert.equal(app.progress(0), 0);
  app.sections[0].top = 760;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.progress(0), .5);
  app.sections[0].top = 400;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.progress(0), 1);
  assert.equal(app.progress(1), 0);
  app.sections[0].top = 1000;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.progress(0), 0);
  app.sections[0].top = 400;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.progress(0), 1);
  app.cleanup();
});

test("reduced motion and focused consultation fields remain fully visible", () => {
  const app = setup([1200], true);
  assert.equal(app.progress(0), 1);
  app.media.matches = false;
  app.mediaEvents.get("change")(); app.flush();
  assert.equal(app.progress(0), 0);
  app.sections[0].focused = true;
  app.focusEvents.get("focusin")(); app.flush();
  assert.equal(app.progress(0), 1);
  app.sections[0].focused = false;
  app.focusEvents.get("focusout")(); app.flush();
  assert.equal(app.progress(0), 0);
  app.cleanup();
});

test("resize recalculates progress and unmount restores static content", () => {
  const app = setup([760]);
  assert.equal(app.progress(0), .5);
  app.window.innerHeight = 500;
  app.events.get("resize")(); app.flush();
  assert.equal(app.progress(0), 0);
  app.events.get("scroll")();
  app.cleanup(); app.flush();
  assert.equal(app.events.size, 0);
  assert.equal(app.mediaEvents.size, 0);
  assert.equal(app.focusEvents.size, 0);
  assert.equal(app.disconnected, true);
  assert.equal(app.sections[0].dataset.motion, undefined);
  assert.equal(app.sections[0].values["--service-progress"], undefined);
});
