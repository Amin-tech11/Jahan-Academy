import assert from "node:assert/strict";
import { test } from "node:test";

import { countryGuides, headerDestinations } from "../lib/site-content.ts";

test("header destinations contain ten unique countries with working guide slugs", () => {
  assert.equal(headerDestinations.length, 10);
  assert.equal(new Set(headerDestinations.map(({ slug }) => slug)).size, 10);
  const guideSlugs = new Set(countryGuides.map(({ slug }) => slug));
  for (const { slug, fa, en } of headerDestinations) {
    assert.ok(guideSlugs.has(slug), `${slug} needs a destination page`);
    assert.ok(fa.trim() && en.trim(), `${slug} needs both labels`);
  }
});

test("destination labels sort alphabetically in each language", () => {
  assert.deepEqual(
    [...headerDestinations].sort((a, b) => a.fa.localeCompare(b.fa, "fa")).map(({ fa }) => fa),
    ["آلمان", "استرالیا", "انگلستان", "ایتالیا", "دانمارک", "سوئد", "فنلاند", "کانادا", "نیوزلند", "هلند"],
  );
  assert.deepEqual(
    [...headerDestinations].sort((a, b) => a.en.localeCompare(b.en, "en")).map(({ en }) => en),
    ["Australia", "Canada", "Denmark", "Finland", "Germany", "Italy", "Netherlands", "New Zealand", "Sweden", "United Kingdom"],
  );
});
