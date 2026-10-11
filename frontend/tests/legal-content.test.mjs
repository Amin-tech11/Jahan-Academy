import assert from "node:assert/strict";
import { test } from "node:test";
import { legalContent } from "../lib/legal-content.ts";

test("privacy policies provide complete parallel bilingual documents", () => {
  for (const page of ["privacy"]) {
    const fa = legalContent.fa[page];
    const en = legalContent.en[page];
    assert.equal(fa.sections.length, en.sections.length);
    assert.ok(fa.sections.length >= 7);
    for (const document of [fa, en]) {
      assert.ok(document.title.trim());
      assert.ok(document.intro.trim());
      assert.equal(new Set(document.sections.map((section) => section.title)).size, document.sections.length);
      for (const section of document.sections) {
        assert.ok(section.title.trim());
        assert.ok(section.paragraphs.length > 0);
        for (const paragraph of section.paragraphs) assert.ok(paragraph.trim().length > 40);
      }
      assert.doesNotMatch(JSON.stringify(document), /CMS|jahanacademy\.local|placeholder/i);
    }
  }
});
