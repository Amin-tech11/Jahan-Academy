import assert from "node:assert/strict";
import test from "node:test";
import { captureLocaleScroll, restoreLocaleScroll } from "../lib/locale-scroll.ts";

test("language switch retains progress through a section with a different translated height", () => {
  const section = { id: "content", tagName: "SECTION", offsetTop: 800, offsetHeight: 600, parentElement: null };
  const sticky = { position: "sticky", parentElement: null };
  const title = { id: "title", tagName: "DIV", offsetTop: 1078, offsetHeight: 62, parentElement: sticky };
  const globals = { window: globalThis.window, document: globalThis.document, getComputedStyle: globalThis.getComputedStyle };
  let destination;
  try {
    globalThis.window = { scrollY: 1000, scrollTo: options => { destination = options.top; } };
    globalThis.getComputedStyle = element => ({ position: element.position ?? "static" });
    globalThis.document = {
      querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 78 }) }),
      querySelectorAll: () => [section, title],
      getElementById: id => id === "content" ? section : null,
    };
    const position = captureLocaleScroll("/en/services");
    assert.equal(position.anchorId, "content", "sticky title must not replace the content anchor");
    section.offsetTop = 900;
    section.offsetHeight = 1200;
    restoreLocaleScroll(position);
    assert.equal(destination, 1402);
    globalThis.document.getElementById = () => null;
    restoreLocaleScroll(position);
    assert.equal(destination, 1000, "missing translated anchor preserves the original scroll offset");
  } finally {
    for (const [key, value] of Object.entries(globals)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
