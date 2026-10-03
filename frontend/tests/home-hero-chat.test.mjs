import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../lib/home-hero-chat.ts", import.meta.url), "utf8");

function setup(reduced = false) {
  let now = 0, id = 0, observer;
  const timers = new Map(), events = new Map(), frames = [];
  const preference = {
    matches: reduced, listeners: new Set(),
    addEventListener(name, fn) { this.listeners.add(fn); },
    removeEventListener(name, fn) { this.listeners.delete(fn); },
    change(value) { this.matches = value; for (const fn of this.listeners) fn(); },
  };
  const document = { hidden: false, addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); } };
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, document,
    window: { matchMedia: () => preference },
    performance: { now: () => now },
    setTimeout(fn, delay) { timers.set(++id, { fn, at: now + delay }); return id; },
    clearTimeout(timer) { timers.delete(timer); },
    IntersectionObserver: class {
      constructor(fn) { observer = this; this.fn = fn; this.disconnected = false; }
      observe() {}
      disconnect() { this.disconnected = true; }
    },
  });
  const player = module.exports.startHeroChat({ dataset: {} }, (frame) => frames.push({ ...frame }));
  const tick = (duration) => {
    const end = now + duration;
    for (;;) {
      const item = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!item || item[1].at > end) break;
      now = item[1].at; timers.delete(item[0]); item[1].fn();
    }
    now = end;
  };
  return { player, tick, frames, timers, events, observer, preference, document, current: () => frames.at(-1) };
}

test("demo shows a question, typing, then an answer before cycling through all three topics", () => {
  const app = setup();
  assert.deepEqual(app.current(), { scene: 0, phase: 0 });
  app.tick(1200); assert.equal(app.current().phase, 1);
  app.tick(1800); assert.equal(app.current().phase, 2);
  app.tick(7200); assert.deepEqual(app.current(), { scene: 1, phase: 0 });
  app.tick(10200); assert.equal(app.current().scene, 2);
  app.tick(10200); assert.deepEqual(app.current(), { scene: 0, phase: 0 });
  assert.equal(app.timers.size, 1);
  app.player.dispose();
});

test("pause preserves remaining phase time and resumes without skipping messages", () => {
  const app = setup();
  app.tick(500); app.player.setPaused(true);
  app.tick(20000); assert.equal(app.current().phase, 0);
  app.player.setPaused(false);
  app.tick(699); assert.equal(app.current().phase, 0);
  app.tick(1); assert.equal(app.current().phase, 1);
  app.player.dispose();
});

test("offscreen and hidden-tab playback pauses and cleans up on unmount", () => {
  const app = setup();
  app.observer.fn([{ isIntersecting: false }]); app.tick(5000);
  assert.equal(app.current().phase, 0);
  app.observer.fn([{ isIntersecting: true }]);
  app.document.hidden = true; app.events.get("visibilitychange")(); app.tick(5000);
  assert.equal(app.current().phase, 0);
  app.document.hidden = false; app.events.get("visibilitychange")(); app.tick(1200);
  assert.equal(app.current().phase, 1);
  app.player.dispose();
  assert.equal(app.timers.size, 0);
  assert.equal(app.events.size, 0);
  assert.equal(app.preference.listeners.size, 0);
  assert.equal(app.observer.disconnected, true);
});

test("reduced motion displays a complete static conversation and responds to preference changes", () => {
  const app = setup(true);
  assert.equal(app.current().phase, 2);
  assert.equal(app.timers.size, 0);
  app.preference.change(false);
  assert.equal(app.current().phase, 0);
  app.tick(1200);
  app.preference.change(true);
  assert.equal(app.current().phase, 2);
  assert.equal(app.timers.size, 0);
  app.player.dispose();
});
