import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../lib/destination-motion.ts", import.meta.url), "utf8");
function setup({ reduced = false, mobile = false, supported = true } = {}) {
  const preference = { matches: reduced, listeners: new Set(),
    addEventListener(_, fn) { this.listeners.add(fn); }, removeEventListener(_, fn) { this.listeners.delete(fn); },
    change(value) { this.matches = value; for (const fn of [...this.listeners]) fn(); } };
  class Element {
    constructor(top = 1200, kind = "up", left = 20) {
      this.top = top; this.left = left; this.dataset = { destinationMotion: kind, destinationDelay: "120" };
      this.animations = []; this.events = new Map(); this.translate = "0 0";
    }
    getBoundingClientRect() { return { top: this.top, bottom: this.top + 200, left: this.left, width: 300 }; }
    contains(target) { return target === this; }
    animate(frames, options) {
      const animation = { frames, options, canceled: false,
        cancel() { this.canceled = true; }, addEventListener(_, fn) { this.finish = fn; } };
      this.animations.push(animation); return animation;
    }
    addEventListener(name, fn) { this.events.set(name, fn); }
    removeEventListener(name) { this.events.delete(name); }
  }
  const first = new Element(100, "side");
  const right = new Element(100, "side", 800);
  const later = new Element();
  const passed = new Element(-500);
  const hero = new Element(0, "zoom");
  const root = new Element(); root.ownerDocument = { activeElement: null };
  root.querySelectorAll = () => [first, right, later, passed, hero];
  let observer;
  class Observer {
    constructor(fn) { this.callback = fn; this.disconnected = false; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
    enter(element, isIntersecting = true) { this.callback([{ target: element, isIntersecting, boundingClientRect: element.getBoundingClientRect() }]); }
  }
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, Node: Element, IntersectionObserver: supported ? Observer : undefined,
    window: { innerWidth: 1200, innerHeight: 1000, getComputedStyle: (e) => ({ translate: e.translate }),
      matchMedia: (query) => query.includes("reduced-motion") ? preference : { matches: mobile } },
  });
  const cleanup = module.exports.startDestinationMotion(root);
  return { root, first, right, later, passed, hero, observer, cleanup, preference };
}

test("restored scroll keeps passed content visible and viewport entry plays once", () => {
  const a = setup();
  assert.equal(a.passed.animations.length, 0);
  assert.equal(a.first.animations.length, 1);
  assert.equal(a.later.dataset.destinationPending, "true");
  a.observer.enter(a.later); a.observer.enter(a.later);
  assert.equal(a.later.animations.length, 1);
  assert.equal(a.later.dataset.destinationPending, undefined);
  a.cleanup();
});

test("replay only resets below the viewport and ignores the entrance's own movement", () => {
  const a = setup(); const e = a.first;
  e.top = -300; a.observer.enter(e, false);
  assert.equal(e.dataset.destinationPending, undefined);
  e.top = 1004; e.translate = "0 16px"; a.observer.enter(e, false);
  assert.equal(e.dataset.destinationPending, undefined);
  e.top = 1200; a.observer.enter(e, false);
  assert.equal(e.dataset.destinationPending, "true");
  assert.equal(e.animations[0].canceled, true);
  e.top = 900; a.observer.enter(e);
  assert.equal(e.animations.length, 2);
  e.animations[1].finish(); assert.equal(e.animations[1].canceled, true);
  a.cleanup();
});

test("keyboard focus reveals immediately, cancels animation and prevents hiding focused fields", () => {
  const a = setup();
  a.root.events.get("focusin")({ target: a.later });
  assert.equal(a.later.dataset.destinationPending, undefined);
  assert.equal(a.later.animations.length, 0);
  a.root.ownerDocument.activeElement = a.later;
  a.observer.enter(a.later, false);
  assert.equal(a.later.dataset.destinationPending, undefined);
  a.root.events.get("focusin")({ target: a.first });
  assert.equal(a.first.animations[0].canceled, true);
  a.cleanup();
});

test("reduced motion, preference changes and cleanup leave no hidden content or active animation", () => {
  for (const options of [{ reduced: true }, { supported: false }]) {
    const a = setup(options); assert.equal(a.observer, undefined);
    assert.equal(a.later.dataset.destinationPending, undefined); a.cleanup();
  }
  const a = setup(); a.preference.change(true);
  assert.equal(a.observer.disconnected, true);
  assert.equal(a.later.dataset.destinationPending, undefined);
  assert.equal(a.hero.animations[0].canceled, true);
  assert.equal(a.root.events.size, 0); assert.equal(a.preference.listeners.size, 0);
  a.observer.enter(a.later); assert.equal(a.later.animations.length, 0);
  a.cleanup();
});

test("desktop sides follow physical placement; mobile uses shorter vertical travel and delay", () => {
  const a = setup();
  assert.equal(a.first.animations[0].frames[0].translate, "-16px 0");
  assert.equal(a.right.animations[0].frames[0].translate, "16px 0");
  assert.equal(a.hero.animations[0].frames[0].scale, 1.02);
  a.cleanup();
  const m = setup({ mobile: true });
  assert.equal(m.first.animations[0].frames[0].translate, "0 8px");
  assert.equal(m.first.animations[0].options.duration, 560);
  assert.equal(m.first.animations[0].options.delay, 60); m.cleanup();
});
