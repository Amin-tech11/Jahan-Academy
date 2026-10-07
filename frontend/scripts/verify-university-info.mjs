import assert from "node:assert/strict";
import { homeUniversities } from "../lib/home-universities.ts";
import { fixtureUniversities } from "../lib/site-content.ts";
import statistics from "../lib/university-info-statistics.json" with { type: "json" };
import facts from "../lib/university-info-facts.json" with { type: "json" };

// Run against this panel after starting pnpm dev:university-info.
const origin = "http://localhost:3600";
for (const locale of ["fa", "en"]) {
  const response = await fetch(`${origin}/${locale}/universities/western-university`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const headings = [...html.matchAll(/<h[1-6]\b[^>]*>(.*?)<\/h[1-6]>/gs)].map((match) => match[1].replace(/<[^>]*>/g, "")).join("\n");
  assert.match(headings, locale === "fa" ? /دانشگاه وسترن/ : /Western University/);
  assert.doesNotMatch(headings, /^(Programs|Scholarships|Services|Cost and Duration|Application Processing Time|Program Levels)$/im);
  for (const tab of ["overview", "features", "location"]) assert.ok(html.includes(`id="tab-${tab}"`));
  assert.ok(html.includes("western-campus.webp"));
  console.log(`${locale}: reference profile, three detail tabs, excluded sections passed`);
}
for (const university of [...homeUniversities, ...fixtureUniversities]) {
 for (const locale of ["fa", "en"]) {
  const response = await fetch(`${origin}/${locale}/universities/${university.slug}`);
  assert.equal(response.status, 200, university.slug);
  const html = await response.text();
  assert.ok(html.includes(university.slug), university.slug);
  assert.ok(html.includes(university.image ?? `/university-info/${university.slug}.jpg`), university.slug);
  assert.equal((html.match(/<details class="[^"]*featureItem[^"]*"/g) || []).length, 5, university.slug);
  assert.ok(html.includes('id="university-notes-title"'), university.slug);
  assert.ok(html.includes(locale === "fa" ? "زندگی در این دانشگاه" : "Life at this university"), university.slug);
  assert.ok(html.includes(locale === "fa" ? "رشته‌های برتر" : "Top disciplines at"), university.slug);
  assert.doesNotMatch(html, /حوزه‌های تحصیلی|>Academic fields</);
  assert.ok(html.includes(String(facts[university.slug].foundedYear)), university.slug);
  assert.ok(html.includes(locale === "fa" ? "نوع مؤسسه" : "Institution type"), university.slug);
  if (Object.hasOwn(statistics, university.slug)) {
    assert.ok((html.match(/<meter\b/g) ?? []).length >= 2, university.slug);
    assert.ok(html.includes(statistics[university.slug].year), university.slug);
    assert.ok(html.includes(locale === "fa" ? "منبع آمار" : "Statistics source"), university.slug);
  } else {
    assert.doesNotMatch(html, /<meter\b/, university.slug);
    assert.ok(html.includes(locale === "fa" ? "آمار قابل استناد" : "Verified statistics"), university.slug);
  }
  assert.doesNotMatch(html, /Campus feature details have not yet been published|Campus photography is not yet available/);
 }
}
for (const path of ["/en/universities/does-not-exist-uni-3600", "/zz/universities/western-university"]) {
  const response = await fetch(`${origin}${path}`);
  const html = await response.text();
  // Next can stream a not-found boundary with status 200 after the shell is sent.
  assert.ok(response.status === 404 || /name="robots" content="noindex"/.test(html), path);
}
console.log("66 localized catalog/public routes and invalid university/locale boundaries passed");
