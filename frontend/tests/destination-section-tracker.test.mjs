import assert from "node:assert/strict";
import test from "node:test";
import { mostVisibleDestinationSection, trackDestinationSections } from "../lib/destination-section-tracker.ts";

const viewport = { top: 200, bottom: 800, left: 0, right: 1000 };
const section = (id, top, bottom, left = 0, right = 1000) => ({ id, top, bottom, left, right });

test("dominance follows visible area, not DOM order or percentage of a tall section", () => {
  assert.equal(mostVisibleDestinationSection([
    section("academics", 200, 350), section("universities", 350, 2400),
  ], viewport), "universities");
  assert.equal(mostVisibleDestinationSection([
    section("narrow", 200, 800, 0, 200), section("wide", 400, 800),
  ], viewport), "wide");
});

test("content concealed by sticky controls and outside the viewport does not count", () => {
  assert.equal(mostVisibleDestinationSection([
    section("academics", -200, 300), section("universities", 500, 1000),
  ], viewport), "universities");
  assert.equal(mostVisibleDestinationSection([
    section("before", -500, 200), section("after", 800, 1400),
    section("offscreen", 200, 800, 1000, 1500),
  ], viewport, "before"), null);
});

test("an exact tie preserves the current option; an empty viewport clears selection", () => {
  const sections = [section("academics", 200, 500), section("universities", 500, 800)];
  assert.equal(mostVisibleDestinationSection(sections, viewport, "universities"), "universities");
  assert.equal(mostVisibleDestinationSection(sections, viewport), "academics");
  assert.equal(mostVisibleDestinationSection(sections, { ...viewport, top: 800 }), null);
});

function setup({ resizeObserver = true } = {}) {
  const events = new Map();
  const changes = [];
  let pending, resizeCallback, disconnected = false, frames = 0;
  const elements = [section("academics", 200, 650), section("universities", 650, 1500)];
  elements.forEach((element) => { element.getBoundingClientRect = () => element; });
  const navigation = { bottom: 200, getBoundingClientRect() { return this; } };
  const header = { getBoundingClientRect: () => ({ bottom: 78 }) };
  const win = {
    innerHeight: 800,
    requestAnimationFrame(callback) { pending = callback; return ++frames; },
    cancelAnimationFrame() { pending = undefined; },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
    ...(resizeObserver ? { ResizeObserver: class {
      constructor(callback) { resizeCallback = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    } } : {}),
  };
  const root = {
    ownerDocument: { defaultView: win, documentElement: { clientWidth: 1000 } },
    querySelectorAll: () => elements,
    closest: () => ({ querySelector: () => header }),
  };
  const cleanup = trackDestinationSections(root, navigation, (id) => changes.push(id));
  return {
    changes, elements, navigation, win, events, cleanup,
    flush() { const callback = pending; pending = undefined; callback?.(); },
    layoutChange() { resizeCallback?.(); },
    get frames() { return frames; },
    get disconnected() { return disconnected; },
  };
}

test("scroll updates all sections together, coalesces frames and resets outside the guide", () => {
  const app = setup();
  assert.deepEqual(app.changes, ["academics"]);
  Object.assign(app.elements[0], { top: -100, bottom: 350 });
  Object.assign(app.elements[1], { top: 350, bottom: 1200 });
  app.events.get("scroll")();
  app.events.get("scroll")();
  assert.equal(app.frames, 1);
  app.flush();
  assert.equal(app.changes.at(-1), "universities");
  // Scroll back up: selection must not remain on the last clicked/seen section.
  Object.assign(app.elements[0], { top: 200, bottom: 650 });
  Object.assign(app.elements[1], { top: 650, bottom: 1500 });
  app.events.get("scroll")(); app.flush();
  assert.equal(app.changes.at(-1), "academics");
  app.navigation.bottom = 900;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.changes.at(-1), null);
  app.cleanup();
});

test("resizing and layout changes remeasure sticky coverage; unmount cancels pending work", () => {
  const app = setup();
  app.win.innerHeight = 1400;
  app.events.get("resize")(); app.flush();
  assert.equal(app.changes.at(-1), "universities");
  app.win.innerHeight = 800;
  app.layoutChange(); app.flush();
  assert.equal(app.changes.at(-1), "academics");
  app.navigation.bottom = 600;
  app.layoutChange(); app.flush();
  assert.equal(app.changes.at(-1), "universities");
  app.events.get("scroll")();
  const count = app.changes.length;
  app.cleanup(); app.flush();
  assert.equal(app.events.size, 0);
  assert.equal(app.disconnected, true);
  assert.equal(app.changes.length, count);
});

test("scroll tracking still works without ResizeObserver", () => {
  const app = setup({ resizeObserver: false });
  app.navigation.bottom = 700;
  app.events.get("scroll")(); app.flush();
  assert.equal(app.changes.at(-1), "universities");
  app.cleanup();
});
