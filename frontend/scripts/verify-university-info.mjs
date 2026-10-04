import assert from "node:assert/strict";
import { homeUniversities } from "../lib/home-universities.ts";

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
for (const university of homeUniversities) {
  const response = await fetch(`${origin}/en/universities/${university.slug}`);
  assert.equal(response.status, 200, university.slug);
  const html = await response.text();
  assert.ok(html.includes(university.slug), university.slug);
  assert.ok(html.includes(university.image), university.slug);
}
for (const path of ["/en/universities/does-not-exist-uni-3600", "/zz/universities/western-university"]) {
  const response = await fetch(`${origin}${path}`);
  const html = await response.text();
  // Next can stream a not-found boundary with status 200 after the shell is sent.
  assert.ok(response.status === 404 || /name="robots" content="noindex"/.test(html), path);
}
console.log("30 catalog routes and invalid university/locale boundaries passed");
