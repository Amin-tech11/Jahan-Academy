import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getHomeContent } from "../lib/home-content.ts";
import { siteCopy } from "../lib/site-content.ts";

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

test("hero uses lead-first consultation copy in both locales", () => {
  assert.equal(siteCopy.fa.heroTitle, "فراتر از مرز ها\nبه سوی آینده ای روشن");
  assert.equal(siteCopy.fa.heroText, "برای تحقق رؤیاهای تحصیلی‌تان، از نخستین گام تا انتخاب مسیر مناسب، با مشاوره‌ای تخصصی همراه و پشتیبان شما خواهیم بود.");
  assert.equal(siteCopy.en.heroTitle, "Beyond borders\nToward a brighter future");
  assert.match(siteCopy.en.heroText, /expert guidance/);
  assert.doesNotMatch(siteCopy.fa.heroText, /شعبه|تضمین|بهترین هزینه|استقرار/);
  assert.equal(getHomeContent("fa").heroServiceLink, "آشنایی با خدمات");
  for (const locale of ["fa", "en"]) {
    assert.equal("heroLabel" in getHomeContent(locale), false);
    assert.equal("heroQuote" in getHomeContent(locale), false);
  }
});

test("Persian hero mirrors only the artwork and layout, not the text", () => {
  const component = readFileSync(new URL("../components/home-page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/home.css", import.meta.url), "utf8");
  assert.match(component, /home-hero--\$\{locale\}/);
  assert.match(css, /\.home-hero--fa \.home-hero__image, \.home-hero--fa \.home-hero__shade \{ transform: scaleX\(-1\); \}/);
  assert.match(css, /\.home-hero--fa \.home-hero__content \{ direction: rtl; \}/);
  assert.doesNotMatch(component, /content\.heroLabel|content\.heroQuote/);
});

test("hero image fills the viewport while copy stays in the content column", () => {
  const component = readFileSync(new URL("../components/home-page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/home.css", import.meta.url), "utf8");
  assert.match(css, /\.home-hero \{[^}]*width: 100%/);
  assert.match(css, /\.home-hero \{[^}]*min-height: clamp\(25rem, 34vw, 34rem\)/);
  assert.match(css, /\.home-hero h1 \{[^}]*font-family: inherit/);
  assert.match(css, /\.home-hero h1 \{[^}]*white-space: pre-line/);
  assert.match(component, /src="\/home-hero-compact\.png"/);
  assert.match(component, /className="shell home-hero__content"/);
  assert.match(component, /heroServiceLink} <span aria-hidden="true">\{locale === "fa" \? "←" : "→"\}<\/span><\/ButtonLink><ConsultationButton/);
  assert.doesNotMatch(component, /home-hero__quote/);
});
