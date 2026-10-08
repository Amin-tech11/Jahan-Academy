import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { homeUniversities } from "../lib/home-universities.ts";
import { fixtureUniversities, headerDestinations } from "../lib/site-content.ts";
import { fromCatalog, fromPublicUniversity, westernUniversity, universityMapEmbedUrl, safeUniversityUrl } from "../lib/university-info-model.ts";
import { enrichUniversityInfo, universityProfiles, universityDisciplineData } from "../lib/university-info-profiles.ts";
import statistics from "../lib/university-info-statistics.json" with { type: "json" };
import facts from "../lib/university-info-facts.json" with { type: "json" };

const profiles = [
  ...homeUniversities.map((u) => fromCatalog(u, headerDestinations.find((c) => c.slug === u.country))),
  ...fixtureUniversities.map(fromPublicUniversity),
].map(enrichUniversityInfo);

test("every listed university has localized content, its own imagery and the complete detail sections", () => {
  assert.equal(profiles.length, 33);
  assert.deepEqual(Object.keys(universityProfiles).sort(), profiles.map((u) => u.slug).sort());
  assert.deepEqual(Object.keys(facts).sort(), profiles.map((u) => u.slug).sort());
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
    assert.ok(u.foundedYear >= 1000 && u.foundedYear <= 2026, u.slug);
    assert.ok(u.address.length > 20 && u.institutionType.fa && u.institutionType.en, u.slug);
    assert.match(u.city.fa, /[\u0600-\u06ff]/, u.slug);
    assert.equal(Boolean(u.dli), u.country.en === "Canada", u.slug);
    if (u.dli) assert.match(u.dli, /^O\d{11}$/);
    assert.equal(Boolean(u.topDisciplines), Object.hasOwn(statistics, u.slug), u.slug);
    assert.ok(!JSON.stringify(u).includes("uwo.ca"), u.slug);
    assert.ok(!u.photos.some((p) => p.src.includes("western")), u.slug);
    assert.match(new URL(universityMapEmbedUrl(u)).searchParams.get("q"), new RegExp(u.englishName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("discipline shares have an auditable population, year and complete numeric distribution", () => {
  assert.equal(Object.keys(statistics).length, 23);
  for (const [slug, record] of Object.entries(statistics)) {
    assert.ok(Object.hasOwn(universityProfiles, slug), slug);
    assert.ok(record.year && record.basis.fa && record.basis.en && safeUniversityUrl(record.source), slug);
    assert.ok((record.supportingSources ?? []).every(safeUniversityUrl), slug);
    for (const [fa, en, count] of record.rows) {
      assert.ok(fa && en && Number.isFinite(count) && count >= 0, slug);
    }
    const sourceTotal = record.rows.reduce((sum, row) => sum + row[2], 0);
    if (record.total) assert.ok(Math.abs(sourceTotal - record.total) <= 1, slug);
    const { topDisciplines, disciplineSource } = universityDisciplineData(slug);
    assert.ok(topDisciplines.length >= 2 && topDisciplines.length <= 4, slug);
    assert.equal(disciplineSource.url, record.source);
    assert.ok(topDisciplines.every((d) => d.percentage >= 0 && d.percentage <= 100), slug);
    assert.ok(Math.abs(topDisciplines.reduce((sum, d) => sum + d.percentage, 0) - 100) <= 0.21, slug);
  }
});

test("calculation uses each university's own denominator and puts the remainder last", () => {
  assert.deepEqual(universityDisciplineData("imperial-college-london").topDisciplines.map((d) => d.percentage), [40.6, 24.5, 22, 12.9]);
  assert.deepEqual(universityDisciplineData("polytechnic-university-of-milan").topDisciplines.map((d) => d.percentage), [75.4, 14.9, 9.7]);
  const charite = universityDisciplineData("charite-universitatsmedizin-berlin");
  assert.equal(charite.topDisciplines.at(-1).name.en, "Other");
  assert.equal(charite.topDisciplines[0].percentage, 34.7);
  assert.match(charite.disciplineSource.basis.en, /New entrants only/);
  assert.match(universityDisciplineData("delft-university-of-technology").disciplineSource.basis.en, /suppressed/);
  for (const slug of ["adelaide-university", "unknown", "__proto__", "constructor"]) {
    assert.deepEqual(universityDisciplineData(slug), {});
  }
  assert.equal(westernUniversity.topDisciplines.reduce((sum, d) => sum + d.percentage, 0), 99, "Preserve published Western shares without normalization");
  assert.equal(profiles.find((u) => u.slug === "adelaide-university").foundedYear, 2024);
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
