import assert from "node:assert/strict";
import { destinations } from "../lib/destination-content.ts";
import { destinationFaqs } from "../lib/destination-faqs.ts";

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
    for (const id of ["academics", "universities", "life", "planning", "visa"]) assert.ok(html.includes(`id="${id}"`));
    const more = html.indexOf('aria-labelledby="more-destinations-title"');
    const faq = html.indexOf('id="destination-faq"');
    const consultation = html.indexOf('id="destination-consultation"');
    assert.ok(more >= 0 && more < faq && faq < consultation, `FAQ placement: ${locale}/${destination.slug}`);
    const faqHtml = html.slice(faq, consultation);
    assert.equal((faqHtml.match(/aria-expanded="false"/g) || []).length, 5);
    assert.equal((faqHtml.match(/role="region"/g) || []).length, 5);
    assert.equal((faqHtml.match(/inert=""/g) || []).length, 5);
    for (const item of destinationFaqs[destination.slug]) {
      assert.ok(faqHtml.includes(item.question[locale]));
      assert.ok(faqHtml.includes(item.answer[locale]));
      assert.ok(faqHtml.includes(`href="${item.source.url}"`));
    }
  }
}
for (const path of ["/fa/countries/unknown-destination", "/fr/countries/canada"]) {
  assert.equal((await fetch(base + path)).status, 404, path);
}
console.log("Destination integration checks passed: root redirect, 20 country/locale routes, section anchors, FAQ placement/content/sources/accessible initial state and 404s.");
