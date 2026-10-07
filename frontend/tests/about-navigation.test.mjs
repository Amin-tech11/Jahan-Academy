import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/about-navigation.tsx", import.meta.url), "utf8");

function setup(tops, width = 1200) {
  const ids = ["story", "purpose", "values", "journey", "questions"];
  const events = new Map();
  let active;
  let effect;
  let scheduled;
  const window = { innerWidth: width, addEventListener: (event, cb) => events.set(event, cb), removeEventListener: (event) => events.delete(event) };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    module, exports: module.exports, window,
    requestAnimationFrame(cb) { scheduled = cb; return 1; },
    cancelAnimationFrame() { scheduled = undefined; },
    document: { getElementById(id) { const index = ids.indexOf(id); return tops[index] === undefined ? null : { getBoundingClientRect: () => ({ top: tops[index] }) }; } },
    require(name) {
      if (name === "react") return { useState: () => ["story", (value) => { active = value; }], useEffect: (cb) => { effect = cb; } };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name.endsWith(".css")) return { default: {} };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  module.exports.AboutNavigation({ labels: ids, title: "About" });
  const cleanup = effect();
  return { events, window, cleanup, get active() { return active; }, get scheduled() { return scheduled; }, flush() { const cb = scheduled; scheduled = undefined; cb?.(); } };
}

test("about navigation follows the arriving section and scrolls back correctly", () => {
  const tops = [-500, -100, 240, 800, 1400];
  const app = setup(tops);
  assert.equal(app.active, "values");
  tops[2] = 500;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.active, "purpose");
  tops[3] = -300; tops[4] = 200;
  app.events.get("scroll")(); app.flush();
  // FAQ remains on the page but is no longer a navigation target.
  assert.equal(app.active, "journey");
  app.cleanup();
});

test("mobile resize adjusts the arrival boundary and cleanup cancels pending work", () => {
  const app = setup([-100, 235, 800, 1200, 1600]);
  assert.equal(app.active, "purpose");
  app.window.innerWidth = 390;
  app.events.get("resize")(); app.flush();
  assert.equal(app.active, "story");
  app.events.get("scroll")();
  assert.ok(app.scheduled);
  app.cleanup();
  assert.equal(app.scheduled, undefined);
  assert.equal(app.events.size, 0);
});
