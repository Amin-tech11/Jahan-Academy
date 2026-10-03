import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { homeUniversities } from "../lib/home-universities.ts";
import { headerDestinations } from "../lib/site-content.ts";
import { fromCatalog, fromPublicUniversity, safeUniversityUrl, universityInfoPath, westernUniversity } from "../lib/university-info-model.ts";

test("all 30 catalog cards resolve to their own university profile and photography", () => {
  for (const university of homeUniversities) {
    const country = headerDestinations.find(({ slug }) => slug === university.country);
    const profile = fromCatalog(university, country);
    assert.equal(profile.slug, university.slug);
    assert.equal(profile.name.en, university.name);
    assert.equal(profile.about.fa, university.summary.fa);
    assert.equal(profile.photos[0].src, university.image);
    assert.deepEqual(profile.features, []);
    assert.equal(profile.foundedYear, undefined, "Do not invent unpublished institution facts");
    assert.ok(existsSync(new URL(`../public${profile.photos[0].src}`, import.meta.url)));
  }
});

test("university URLs retain locale and encode untrusted slug segments", () => {
  assert.equal(universityInfoPath("fa", "mcgill-university"), "/fa/universities/mcgill-university");
  assert.equal(universityInfoPath("en", "a/b?#"), "/en/universities/a%2Fb%3F%23");
});

test("public university content rejects unsafe links while preserving valid institution facts", () => {
  for (const unsafe of ["javascript:alert(1)", "data:text/html,test", "//example.com", "https://user:pass@example.com", "not a url"]) {
    assert.equal(safeUniversityUrl(unsafe), undefined);
  }
  assert.equal(safeUniversityUrl("https://www.uwo.ca"), "https://www.uwo.ca/");
  const profile = fromPublicUniversity({ slug: "test", name: { fa: "دانشگاه", en: "University" }, summary: { fa: "معرفی", en: "About" }, country: { fa: "کانادا", en: "Canada" }, foundedYear: 1900, websiteUrl: "javascript:alert(1)" });
  assert.equal(profile.websiteUrl, undefined);
  assert.deepEqual(profile.sources, []);
  assert.deepEqual(profile.photos, []);
  assert.equal(profile.foundedYear, 1900);
  assert.equal(profile.location.en, "Canada");
});

test("Western reference profile has complete local gallery assets and source links", () => {
  assert.equal(westernUniversity.slug, "western-university");
  assert.equal(westernUniversity.photos.length, 4);
  for (const photo of westernUniversity.photos) {
    assert.ok(existsSync(new URL(`../public${photo.src}`, import.meta.url)));
    assert.ok(photo.caption.fa && photo.caption.en);
  }
  for (const source of westernUniversity.sources) assert.ok(safeUniversityUrl(source.url));
  assert.ok(westernUniversity.about.fa && westernUniversity.about.en);
});
