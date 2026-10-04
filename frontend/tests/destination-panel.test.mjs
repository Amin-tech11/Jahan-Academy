import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { destinations, findDestination, destinationConsultationHref } from "../lib/destination-content.ts";
import { sourcePageUrl } from "../lib/consultation.ts";
import { headerDestinations } from "../lib/site-content.ts";
import { homeUniversities } from "../lib/home-universities.ts";
import { destinationCollages } from "../lib/destination-collages.ts";

test("every destination exposed in navigation has a unique bilingual guide", () => {
  assert.deepEqual(destinations.map(({ slug }) => slug).sort(), headerDestinations.map(({ slug }) => slug).sort());
  assert.equal(new Set(destinations.map(({ slug }) => slug)).size, destinations.length);
  for (const destination of destinations) {
    for (const field of ["name", "tagline", "academics", "life", "language", "cities", "imageLabel"]) {
      for (const locale of ["fa", "en"]) assert.ok(destination[field][locale].trim(), `${destination.slug}.${field}.${locale}`);
    }
    assert.equal(new URL(destination.source).protocol, "https:");
    for (const field of ["summary", "admission", "documents", "process"]) {
      for (const locale of ["fa", "en"]) assert.ok(destination.visa[field][locale].trim(), `${destination.slug}.visa.${field}.${locale}`);
    }
    for (const field of ["summary", "tuition", "living", "arrival", "funding"]) {
      for (const locale of ["fa", "en"]) assert.ok(destination.planning[field][locale].trim(), `${destination.slug}.planning.${field}.${locale}`);
    }
  }
});

test("each destination has its own available photography, flag and matching universities", () => {
  for (const destination of destinations) {
    const universities = homeUniversities.filter(({ country }) => country === destination.slug);
    assert.ok(universities.length >= 1, `No universities for ${destination.slug}`);
    for (const [section, photos] of Object.entries(destinationCollages(destination, homeUniversities))) {
      assert.equal(photos.length, 3, `${destination.slug}.${section}`);
      assert.equal(new Set(photos.map(({ src }) => src)).size, 3, `Repeated tile in ${destination.slug}.${section}`);
      assert.ok(photos.some(({ src }) => src === destination.image || universities.some(({ image }) => image === src)), `Missing local context for ${destination.slug}.${section}`);
      for (const photo of photos) {
        assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)), `Missing collage asset ${photo.src}`);
        for (const locale of ["fa", "en"]) assert.ok(photo.alt[locale].trim());
      }
    }
    for (const asset of [destination.image, `/destinations/flags/${destination.slug}.svg`, `/destinations/word-flags/${destination.slug}.svg`, ...universities.flatMap(({ image, logo }) => [image, logo])]) {
      assert.ok(existsSync(new URL(`../public${asset}`, import.meta.url)), `Missing asset ${asset}`);
    }
  }
  assert.equal(new Set(destinations.map(({ academics }) => academics.fa)).size, destinations.length);
  assert.equal(new Set(destinations.map(({ life }) => life.en)).size, destinations.length);
});

test("unknown and malformed destination keys do not fall back to another country", () => {
  for (const slug of ["", "unknown", "Canada", "../canada", "__proto__", "canada/germany"]) assert.equal(findDestination(slug), undefined);
  assert.equal(findDestination("canada").currency, "CAD");
  assert.equal(findDestination("germany").currency, "EUR");
});

test("consultation links preserve the origin through the existing consultation contract", () => {
  for (const locale of ["fa", "en"]) {
    for (const destination of destinations) {
      const href = new URL(destinationConsultationHref(locale, destination.slug), "http://localhost:3700");
      assert.equal(sourcePageUrl(locale, href.searchParams.get("source")), `/${locale}/countries/${destination.slug}`);
      for (const university of homeUniversities.filter(({ country }) => country === destination.slug)) {
        const url = new URL(destinationConsultationHref(locale, destination.slug, university.slug), href);
        assert.equal(sourcePageUrl(locale, url.searchParams.get("source")), `/${locale}/universities/${university.slug}`);
      }
    }
  }
});
