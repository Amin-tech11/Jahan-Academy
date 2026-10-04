import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { homeUniversities } from "../lib/home-universities.ts";
import { fixtureUniversities, headerDestinations } from "../lib/site-content.ts";
import { fromCatalog, fromPublicUniversity, westernUniversity, universityMapEmbedUrl, safeUniversityUrl } from "../lib/university-info-model.ts";
import { enrichUniversityInfo, universityProfiles } from "../lib/university-info-profiles.ts";

const profiles = [
  ...homeUniversities.map((u) => fromCatalog(u, headerDestinations.find((c) => c.slug === u.country))),
  ...fixtureUniversities.map(fromPublicUniversity),
].map(enrichUniversityInfo);

test("every listed university has localized content, its own imagery and the complete detail sections", () => {
  assert.equal(profiles.length, 33);
  assert.deepEqual(Object.keys(universityProfiles).sort(), profiles.map((u) => u.slug).sort());
  for (const u of profiles) {
    assert.ok(u.logo && existsSync(new URL(`../public${u.logo}`, import.meta.url)), u.slug);
    assert.ok(u.photos.length && u.photos.every((p) => existsSync(new URL(`../public${p.src}`, import.meta.url))), u.slug);
    assert.equal(u.offerings.length, 5, u.slug);
    assert.equal(u.features.length, 3, u.slug);
    assert.ok(u.whyChoose.length >= 2 && u.notes.length >= 2, u.slug);
    for (const locale of ["fa", "en"]) {
      assert.ok(u.about[locale].length > 100, u.slug);
      for (const item of [...u.features, ...u.offerings, ...u.whyChoose, ...u.notes]) {
        assert.ok(item.title[locale] && item.text[locale], u.slug);
        assert.ok(safeUniversityUrl(item.url ?? item.sourceUrl), u.slug);
      }
      assert.ok(u.academicFields.every((field) => field[locale]), u.slug);
    }
    assert.ok(u.sources.every((source) => safeUniversityUrl(source.url)), u.slug);
    assert.equal(u.topDisciplines, undefined, "Do not manufacture percentages from academic fields");
    assert.ok(!JSON.stringify(u).includes("uwo.ca"), u.slug);
    assert.ok(!u.photos.some((p) => p.src.includes("western")), u.slug);
    assert.match(new URL(universityMapEmbedUrl(u)).searchParams.get("q"), new RegExp(u.englishName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("country guidance never transfers Canadian work rules to another country", () => {
  for (const u of profiles) {
    const guidance = u.offerings.filter((f) => ["permit", "work"].includes(f.icon));
    assert.equal(guidance.length, 2);
    for (const row of guidance) {
      assert.equal(new URL(row.url).hostname === "www.canada.ca", u.country.en === "Canada", u.slug);
      assert.ok(row.text.en.includes(u.country.en), u.slug);
      assert.notEqual(row.status.en, "Available");
    }
  }
});

test("enrichment preserves catalog assets, reference content and the public API fallback", () => {
  for (const u of homeUniversities) {
    const profile = profiles.find((p) => p.slug === u.slug);
    assert.equal(profile.photos[0].src, u.image);
    assert.equal(profile.logo, u.logo);
    assert.equal(profile.name.en, u.name);
  }
  assert.equal(enrichUniversityInfo(westernUniversity), westernUniversity);
  for (const slug of ["unknown-university", "constructor", "__proto__"]) {
    const base = { ...westernUniversity, slug };
    assert.equal(enrichUniversityInfo(base), base);
  }
});
