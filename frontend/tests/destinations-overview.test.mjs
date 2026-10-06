import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { destinationOverviews, filterDestinations, normalizeDestinationSearch } from "../lib/destinations-overview.ts";
import { countryGuides, headerDestinations } from "../lib/site-content.ts";
import { destinationResources } from "../lib/destination-resources.ts";

test("each comparison country has a named HTTPS study portal without embedded credentials", () => {
  assert.deepEqual(Object.keys(destinationResources).sort(), destinationOverviews.map(country => country.slug).sort());
  for (const source of Object.values(destinationResources)) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.equal(url.username + url.password, "");
    assert.ok(source.name.trim());
  }
});

test("overview covers every navigation country and points to existing guides and local imagery", () => {
  assert.ok(existsSync(new URL("../public/destinations/world-map-hero-wide.png", import.meta.url)));
  assert.equal(destinationOverviews.length, 10);
  assert.equal(new Set(destinationOverviews.map(({ slug }) => slug)).size, 10);
  assert.deepEqual(new Set(destinationOverviews.map(({ slug }) => slug)), new Set(headerDestinations.map(({ slug }) => slug)));
  for (const entry of destinationOverviews) {
    assert.ok(countryGuides.some(({ slug }) => slug === entry.slug));
    assert.ok(existsSync(new URL(`../public${entry.image}`, import.meta.url)), entry.image);
    assert.ok(existsSync(new URL(`../public/destinations/flags/${entry.slug}.svg`, import.meta.url)));
    for (const locale of ["fa", "en"]) {
      for (const field of ["name", "intro", "capital", "language", "imageAlt"]) assert.ok(entry[field][locale].trim());
    }
  }
});

test("search matches Persian and English country names regardless of typing conventions", () => {
  for (const query of ["آلمان", "المان", "  GERMANY "]) assert.deepEqual(filterDestinations(query, "all").map(({ slug }) => slug), ["germany"]);
  for (const query of ["كانادا", "کانادا", "Canada"]) assert.equal(filterDestinations(query, "all")[0].slug, "canada");
  for (const query of ["نيوزيلند", "نیوزلند", "New Zealand", "new-zealand", "new\u200czealand"]) assert.equal(filterDestinations(query, "all")[0].slug, "new-zealand");
  assert.equal(filterDestinations("بریتانیا", "all")[0].slug, "united-kingdom");
  assert.equal(normalizeDestinationSearch("آلْمَان"), normalizeDestinationSearch("المان"));
});

test("region and query filters combine without mutating the source or leaking unrelated results", () => {
  const original = JSON.stringify(destinationOverviews);
  assert.equal(filterDestinations("", "europe").length, 7);
  assert.deepEqual(filterDestinations("", "americas").map(({ slug }) => slug), ["canada"]);
  assert.equal(filterDestinations("", "oceania").length, 2);
  assert.deepEqual(filterDestinations("Canada", "europe"), []);
  assert.deepEqual(filterDestinations("no-such-country", "all"), []);
  assert.deepEqual(filterDestinations("<script>", "all"), []);
  assert.equal(filterDestinations("   ", "all").length, 10);
  assert.equal(JSON.stringify(destinationOverviews), original);
});
