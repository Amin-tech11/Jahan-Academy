import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { homeUniversities } from "../lib/home-universities.ts";
import { headerDestinations } from "../lib/site-content.ts";
import { fromCatalog, fromPublicUniversity, safeUniversityUrl, universityIdentityLocation, universityInfoPath, universityMapEmbedUrl, westernUniversity } from "../lib/university-info-model.ts";

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

test("identity uses the reference location and short address without changing the full campus address", () => {
  assert.deepEqual(universityIdentityLocation(westernUniversity), {
    label: "London, Ontario, CA",
    flag: "/destinations/flags/canada.svg",
    address: "1151 Richmond Street, London",
  });
  assert.equal(westernUniversity.address, "1151 Richmond Street, London, Ontario, Canada");
});

test("catalog identity flags exist and unpublished street addresses stay absent", () => {
  for (const university of homeUniversities) {
    const country = headerDestinations.find(({ slug }) => slug === university.country);
    const identity = universityIdentityLocation(fromCatalog(university, country));
    assert.ok(identity.flag);
    assert.ok(existsSync(new URL(`../public${identity.flag}`, import.meta.url)));
    assert.equal(identity.address, undefined);
    assert.ok(identity.label.startsWith(university.location.split(",")[0]));
  }
});

test("unknown countries preserve their location without inventing a flag or address", () => {
  for (const country of ["Unknown country", "constructor", "__proto__"]) {
    const profile = fromPublicUniversity({ slug: "test", name: { fa: "دانشگاه", en: "University" }, summary: { fa: "", en: "" }, country: { fa: country, en: country } });
    assert.deepEqual(universityIdentityLocation(profile), { label: country, flag: undefined, address: undefined });
  }
});

test("campus map uses verified coordinates on the fixed Google Maps origin", () => {
  const url = new URL(universityMapEmbedUrl(westernUniversity));
  assert.equal(url.origin, "https://maps.google.com");
  assert.equal(url.searchParams.get("q"), "43.0095971,-81.2737336");
  assert.equal(url.searchParams.get("output"), "embed");
  assert.equal(url.searchParams.get("t"), "m");
  assert.equal(url.searchParams.has("layer"), false);
});

test("missing or invalid coordinates fall back to the actual university name and location", () => {
  for (const coordinates of [undefined, { latitude: NaN, longitude: 10 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
    const url = new URL(universityMapEmbedUrl({ ...westernUniversity, coordinates, address: undefined }));
    assert.equal(url.searchParams.get("q"), "Western University, London, Ontario, Canada");
  }
});

test("map queries cannot inject iframe URL parameters", () => {
  const url = new URL(universityMapEmbedUrl({ ...westernUniversity, coordinates: undefined, englishName: "University &output=evil#fragment", address: "Street ?x=1&y=2" }));
  assert.equal(url.searchParams.get("q"), "University &output=evil#fragment, Street ?x=1&y=2");
  assert.deepEqual(url.searchParams.getAll("output"), ["embed"]);
  assert.equal(url.hash, "");
});
