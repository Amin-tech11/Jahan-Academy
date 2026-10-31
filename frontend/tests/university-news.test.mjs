import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { blogHref, blogImage, selectBlogPosts } from "../lib/blog-content.ts";

const news = JSON.parse(readFileSync(new URL("../lib/university-news-data.json", import.meta.url), "utf8"));

test("all prepared news stories have bilingual copy, unique reading routes and matching artwork", () => {
  assert.equal(news.length, 45);
  assert.equal(new Set(news.map(item => item.slug)).size, 45);
  for (const item of news) {
    assert.equal(item.type, "news");
    assert.ok(existsSync(new URL(`../public${item.image}`, import.meta.url)));
    assert.equal(blogImage(item), item.image);
    assert.ok(item.sourceDate <= item.date);
    for (const locale of ["fa", "en"]) {
      assert.equal(blogHref(item, locale), `/${locale}/news/${item.slug}`);
      assert.ok(item.title[locale].trim());
      assert.ok(item.excerpt[locale].trim());
      assert.ok(item.paragraphs[locale].length >= 2);
      assert.ok(item.imageCaption[locale].trim());
      assert.ok(item.imageAlt[locale].trim());
    }
    for (const source of item.sources) assert.equal(new URL(source.url).protocol, "https:");
  }
});

test("journal pagination can expose all ten news items without mixing them with guides", () => {
  const items = selectBlogPosts(news, "fa", { type: "news", now: Date.parse("2026-10-19T23:59:59Z") });
  assert.equal(items.slice(0, 6).length, 6);
  assert.equal(items.slice(6, 12).length, 4);
  assert.equal(selectBlogPosts(news, "fa", { type: "guide" }).length, 0);
  assert.equal(selectBlogPosts(news, "fa", { now: Date.parse("2026-10-18T23:59:59Z") }).length, 0);
});

test("October 27 publication adds fifteen complete stories while preserving the earlier archive", () => {
  const current = selectBlogPosts(news, "fa", { type: "news", now: Date.parse("2026-10-27T23:59:59Z") });
  assert.equal(current.length, 25);
  const added = current.filter(item => item.date === "2026-10-27");
  assert.equal(added.length, 15);
  assert.equal(new Set(added.map(item => item.image)).size, 15);
  for (const item of added) {
    assert.ok(item.sectionsFa.length >= 3);
    assert.deepEqual(item.sectionsFa.flatMap(section => section.paragraphs), item.paragraphs.fa);
    assert.ok(item.metaDescription.fa.length >= 120);
    assert.equal(item.imageWidth, 1536);
    assert.equal(item.imageHeight, 1024);
  }
});
