import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { homeUniversities } from "../lib/home-universities.ts";
import { headerDestinations } from "../lib/site-content.ts";

test("selected universities provide three cards and local images for every destination", () => {
  assert.equal(homeUniversities.length, 30);
  assert.equal(new Set(homeUniversities.map(({ slug }) => slug)).size, homeUniversities.length);

  for (const country of headerDestinations) {
    const universities = homeUniversities.filter((university) => university.country === country.slug);
    assert.equal(universities.length, 3, `${country.slug} needs three cards`);

    for (const university of universities) {
      assert.ok(university.name.trim() && university.location.trim());
      assert.ok(university.summary.fa.trim() && university.summary.en.trim());
      for (const asset of [university.image, university.logo]) {
        assert.ok(existsSync(new URL(`../public${asset}`, import.meta.url)), `Missing asset: ${asset}`);
      }
    }
  }
});

test("Adelaide card identifies the new merged university", () => {
  const adelaide = homeUniversities.find(({ slug }) => slug === "adelaide-university");
  assert.ok(adelaide);
  assert.match(adelaide.summary.en, /University of Adelaide.*University of South Australia/);
});
