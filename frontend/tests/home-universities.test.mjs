import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("every destination has a local vector flag", () => {
  for (const { slug } of headerDestinations) {
    const flag = new URL(`../public/destinations/flags/${slug}.svg`, import.meta.url);
    assert.ok(existsSync(flag), `Missing vector flag: ${slug}`);
    assert.match(readFileSync(flag, "utf8"), /<svg\b/);
  }
});
test("university country maps have local SVG assets and source credits", () => {
  const sources = JSON.parse(readFileSync(new URL("../public/home-country-maps/sources.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
  for (const { slug } of headerDestinations) {
    const svg = readFileSync(new URL(`../public/home-country-maps/${slug}.svg`, import.meta.url), "utf8");
    assert.match(svg, /<svg\b/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\bon(?:load|error)\s*=/i);
    assert.ok(sources.some((source) => source.slug === slug && source.url && source.license));
  }
});

test("country controls serve small content-addressed maps for every destination", () => {
  const maps = JSON.parse(readFileSync(new URL("../lib/home-country-map-assets.json", import.meta.url), "utf8"));
  let bytes = 0;
  for (const { slug } of headerDestinations) {
    assert.match(maps[slug], /^\/hero-assets\/[a-f0-9]{16}-map-128\.webp$/);
    const file = readFileSync(new URL(`../public${maps[slug]}`, import.meta.url));
    assert.equal(file.toString("ascii", 8, 12), "WEBP");
    assert.ok(file.length < 10000, `${slug} exceeds icon payload budget`);
    bytes += file.length;
  }
  assert.ok(bytes < 50000, "Country controls should not download large source vectors");
});
