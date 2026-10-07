import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../lib/home-motion.ts", import.meta.url), "utf8");

function setup({ reduced = false, mobile = false, supported = true, custom = false } = {}) {
  const preference = {
    matches: reduced, listeners: new Set(),
    addEventListener(name, fn) { this.listeners.add(fn); },
    removeEventListener(name, fn) { this.listeners.delete(fn); },
    change(value) { this.matches = value; for (const fn of [...this.listeners]) fn(); },
  };
  class Element {
    constructor(top = 1200, even = false) { this.top = top; this.even = even; this.dataset = {}; this.animations = []; this.events = new Map(); }
    getBoundingClientRect() { return { top: this.top, bottom: this.top + 200 }; }
    matches(selector) { return selector === ".site-footer" && this.footer; }
    closest() { return this.even ? {} : null; }
    contains(target) { return target === this; }
    animate(frames, options) {
      const events = new Map();
      const animation = {
        frames, options, canceled: false,
        addEventListener(name, fn) { events.set(name, fn); },
        cancel() { this.canceled = true; },
        finish() { events.get("finish")?.(); },
      };
      this.animations.push(animation);
      return animation;
    }
    getAnimations() { return this.animations.filter((a) => !a.canceled); }
    addEventListener(name, fn) { this.events.set(name, fn); }
    removeEventListener(name) { this.events.delete(name); }
  }
  const first = new Element(100);
  const later = new Element();
  const passed = new Element(-500);
  const media = new Element(1300, true);
  const footer = new Element(2000); footer.footer = true;
  const hero = new Element(0);
  const parent = new Element();
  const root = new Element();
  root.parentElement = parent;
  root.ownerDocument = { activeElement: null };
  root.nextElementSibling = footer;
  root.querySelector = (selector) => selector === (custom ? ".university-hero" : ".home-hero__image") ? hero : null;
  root.querySelectorAll = (selector) => selector === (custom ? ".university-cards" : ".home-service-card") ? [first, later, passed]
    : selector === ".home-process__media" ? [media] : [];
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; this.observed = new Set(); this.disconnected = false; observer = this; }
    observe(element) { this.observed.add(element); }
    unobserve(element) { this.observed.delete(element); }
    disconnect() { this.observed.clear(); this.disconnected = true; }
    leave(element, top = 1100) { this.callback([{ target: element, isIntersecting: false, boundingClientRect: { top } }]); }
    enter(element) { this.callback([{ target: element, isIntersecting: true }]); }
  }
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports, HTMLElement: Element, Node: Element,
    IntersectionObserver: supported ? Observer : undefined,
    window: { getComputedStyle: (element) => ({ translate: element.translate ?? "none" }), innerHeight: 1000, matchMedia: (query) => query.includes("reduced-motion") ? preference : { matches: mobile } },
  });
  const cleanup = module.exports.startHomeMotion(root, custom ? {
    groups: [[".university-cards", "up", 60]],
    heroSelector: ".university-hero",
    includeFooter: false,
  } : undefined);
  return { root, first, later, passed, media, hero, footer, parent, preference, observer, cleanup, animate: module.exports.animateHomeElement };
}

test("university targets reuse home timing, replay and accessibility without touching the footer", () => {
  const app = setup({ custom: true });
  assert.equal(app.hero.animations[0].options.duration, 1200);
  assert.equal(app.observer.observed.has(app.footer), false);
  assert.equal(app.observer.observed.has(app.media), false);
  app.observer.enter(app.later);
  assert.equal(app.later.animations[0].options.duration, 760);
  assert.equal(app.later.animations[0].options.delay, 60);
  app.observer.leave(app.later);
  assert.equal(app.later.dataset.homePending, "true");
  app.parent.events.get("focusin")({ target: app.later });
  assert.equal(app.later.dataset.homePending, undefined);
  app.preference.change(true);
  assert.equal(app.observer.disconnected, true);
  assert.equal(app.preference.listeners.size, 0);
  app.cleanup();
});

test("sections reveal once per visit and replay after scrolling upward past them", () => {
  const app = setup();
  assert.equal(app.first.animations.length, 1);
  assert.equal(app.passed.animations.length, 0);
  assert.equal(app.later.dataset.homePending, "true");
  app.observer.enter(app.later);
  assert.equal(app.later.dataset.homePending, undefined);
  assert.equal(app.later.animations.length, 1);
  assert.equal(app.observer.observed.has(app.later), true);
  app.observer.enter(app.later);
  assert.equal(app.later.animations.length, 1);
  app.cleanup();
});

test("keyboard focus immediately exposes a pending section without waiting", () => {
  const app = setup();
  app.parent.events.get("focusin")({ target: app.later });
  assert.equal(app.later.dataset.homePending, undefined);
  assert.equal(app.later.animations.length, 0);
  app.parent.events.get("focusin")({ target: app.first });
  assert.equal(app.first.animations[0].canceled, true);
  app.cleanup();
});

test("reduced motion and unsupported browsers keep all content visible", () => {
  for (const options of [{ reduced: true }, { supported: false }]) {
    const app = setup(options);
    assert.equal(app.observer, undefined);
    assert.equal(app.later.dataset.homePending, undefined);
    assert.equal(app.hero.animations.length, 0);
    app.cleanup();
  }
});

test("changing motion preference reveals pending content and cancels all motion", () => {
  const app = setup();
  app.preference.change(true);
  assert.equal(app.later.dataset.homePending, undefined);
  assert.equal(app.footer.dataset.homePending, undefined);
  assert.equal(app.observer.disconnected, true);
  assert.equal(app.hero.animations[0].canceled, true);
  assert.equal(app.first.animations[0].canceled, true);
  assert.equal(app.preference.listeners.size, 0);
  assert.equal(app.parent.events.size, 0);
  app.observer.enter(app.later);
  assert.equal(app.later.animations.length, 0);
  app.cleanup();
});

test("mobile entrances use short vertical travel and preserve hero mirroring", () => {
  const app = setup({ mobile: true });
  app.observer.enter(app.media);
  assert.equal(app.media.animations[0].frames[0].translate, "0 8px");
  assert.equal(app.media.animations[0].options.duration, 560);
  assert.equal(app.hero.animations[0].frames[0].scale, 1.02);
  assert.equal("transform" in app.hero.animations[0].frames[0], false);
  app.cleanup();
});

test("alternating journey entrances and footer use their intended directions", () => {
  const app = setup();
  app.observer.enter(app.media);
  app.observer.enter(app.footer);
  assert.equal(app.media.animations[0].frames[0].translate, "-16px 0");
  assert.equal(app.footer.animations[0].frames[0].translate, "0 0");
  app.cleanup();
  assert.equal(app.media.animations[0].canceled, true);
  assert.equal(app.preference.listeners.size, 0);
});

test("country-change animation stops immediately when reduced motion is enabled", () => {
  const app = setup();
  app.animate(app.later);
  app.preference.change(true);
  assert.ok(app.later.animations.every((a) => a.canceled));
  const count = app.later.animations.length;
  app.animate(app.later);
  assert.equal(app.later.animations.length, count);
  app.cleanup();
});

test("exit below resets and cancels motion; repeated downward visits replay cleanly", () => {
  const app = setup();
  for (let i = 0; i < 5; i++) {
    app.observer.enter(app.later);
    assert.equal(app.later.animations.length, i + 1);
    app.observer.leave(app.later);
    assert.equal(app.later.dataset.homePending, "true");
    assert.ok(app.later.animations.every((animation) => animation.canceled));
  }
  app.observer.enter(app.later);
  assert.equal(app.later.dataset.homePending, undefined);
  app.cleanup();
  assert.equal(app.preference.listeners.size, 0);
});

test("leaving above or still partially visible does not reset section content", () => {
  const app = setup();
  app.observer.enter(app.later);
  app.observer.leave(app.later, -300);
  app.observer.enter(app.later);
  app.observer.leave(app.later, 999);
  assert.equal(app.later.dataset.homePending, undefined);
  assert.equal(app.later.animations.length, 1);
  app.cleanup();
});

test("focused form stays visible and hero replays on return to the top", () => {
  const app = setup();
  app.observer.enter(app.later);
  app.root.ownerDocument.activeElement = app.later;
  app.observer.leave(app.later);
  assert.equal(app.later.dataset.homePending, undefined);
  app.root.ownerDocument.activeElement = null;
  app.observer.leave(app.later);
  assert.equal(app.later.dataset.homePending, "true");
  app.observer.leave(app.hero, -500);
  app.observer.enter(app.hero);
  assert.equal(app.hero.animations.length, 2);
  assert.equal(app.hero.animations[1].frames[0].scale, 1.02);
  app.cleanup();
});

test("entrance translation cannot trigger a reset loop at the viewport edge", () => {
  const app = setup();
  app.observer.enter(app.later);
  app.later.translate = "0px 20px";
  app.observer.leave(app.later, 1010);
  assert.equal(app.later.dataset.homePending, undefined);
  assert.equal(app.later.animations[0].canceled, false);
  app.observer.leave(app.later, 1030);
  assert.equal(app.later.dataset.homePending, "true");
  app.cleanup();
});
