import assert from "node:assert/strict";
import { destinations } from "../lib/destination-content.ts";

const base = "http://localhost:3700";
const root = await fetch(base, { redirect: "manual" });
assert.equal(root.status, 307);
assert.equal(new URL(root.headers.get("location"), base).pathname, "/fa/countries/canada");
for (const locale of ["fa", "en"]) {
  for (const destination of destinations) {
    const response = await fetch(`${base}/${locale}/countries/${destination.slug}`);
    assert.equal(response.status, 200, `${locale}/${destination.slug}`);
    const html = await response.text();
    assert.ok(html.includes(destination.name[locale]));
    assert.ok(html.includes(destination.source));
    for (const id of ["academics", "universities", "life", "planning", "visa"]) assert.ok(html.includes(`id="${id}"`));
  }
}
for (const path of ["/fa/countries/unknown-destination", "/fr/countries/canada"]) {
  assert.equal((await fetch(base + path)).status, 404, path);
}
console.log("Destination integration checks passed: root redirect, 20 country/locale routes, section anchors, official sources and 404s.");
