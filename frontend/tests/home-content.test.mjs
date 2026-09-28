import assert from "node:assert/strict";
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

test("hero uses the approved reference copy in both locales", () => {
  assert.equal(siteCopy.fa.heroTitle, "آینده تحصیلی‌ات را آگاهانه بساز");
  assert.equal(siteCopy.fa.heroText, "با مشاوره تخصصی و تجربه‌ی مطمئن، مسیر تحصیل در خارج از کشور را آسان‌تر طی کن.");
  assert.deepEqual(getHomeContent("fa").heroQuote, ["فراتر از مرزها", "به سوی آینده‌ای روشن"]);
  assert.equal(getHomeContent("fa").heroServiceLink, "آشنایی با خدمات");
  assert.equal(getHomeContent("en").heroQuote.length, 2);
  assert.equal(getHomeContent("en").heroLabel, getHomeContent("fa").heroLabel);
});
