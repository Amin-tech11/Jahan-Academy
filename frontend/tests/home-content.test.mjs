import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getHomeContent } from "../lib/home-content.ts";

test("Home copy is complete and parallel in Persian and English", () => {
  const fa = getHomeContent("fa");
  const en = getHomeContent("en");
  assert.deepEqual(Object.keys(fa).sort(), Object.keys(en).sort());
  assert.equal(fa.steps.length, 3);
  assert.equal(en.steps.length, 3);
  assert.equal(fa.trustValues.length, 3);
  assert.equal(en.trustValues.length, 3);
  for (const copy of [fa, en]) {
    for (const [key, value] of Object.entries(copy)) {
      if (typeof value === "string") assert.ok(value.trim(), `${key} must not be empty`);
    }
  }
});

test("Home copy avoids unverified conversion claims and public Program offers", () => {
  const text = JSON.stringify([getHomeContent("fa"), getHomeContent("en")]);
  assert.doesNotMatch(text, /95%|5,000/);
  assert.doesNotMatch(text, /\/programs\b|tuition|application fee|deadline/i);
});

test("hero remains full width and mirrors the artwork in Persian", () => {
  const component = readFileSync(new URL("../components/home-page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/home.css", import.meta.url), "utf8");
  assert.match(component, /home-hero--\$\{locale\}/);
  assert.match(component, /src="\/home-hero-compact\.png"/);
  assert.match(css, /\.home-hero \{[^}]*width: 100%/);
  assert.match(css, /\.home-hero \{[^}]*min-height: clamp\(20rem, 28vw, 28rem\)/);
  assert.match(css, /\.home-hero--fa \.home-hero__image, \.home-hero--fa \.home-hero__shade \{ transform: scaleX\(-1\); \}/);
});

test("hero has no service or assessment actions in either locale", () => {
  const component = readFileSync(new URL("../components/home-page.tsx", import.meta.url), "utf8");
  const hero = component.match(/<div className=\{`home-hero[\s\S]*?<\/div>/)?.[0];
  assert.ok(hero);
  assert.doesNotMatch(hero, /ButtonLink|ConsultationButton|heroServiceLink|home-hero__actions/);
  assert.match(hero, /aria-hidden="true"/);
});
