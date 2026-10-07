import assert from "node:assert/strict";
import { test } from "node:test";
import { selectBlogPosts, blogDate, blogHref, normalizeSearch } from "../lib/blog-content.ts";
import { blogGuides, blogFaq } from "../lib/blog-guides.ts";

const post = (slug, date, type = "article", title = "انتخاب مقصد تحصیلی") => ({ slug, date, type, title: { fa: title, en: "Choosing a destination" }, excerpt: { fa: "آماده‌سازی مشاوره", en: "Prepare for consultation" } });
const posts = [post("old", "2026-01-01"), post("new", "2026-09-22", "news"), post("middle", "2026-05-20")];
const now = Date.parse("2026-10-03T00:00:00Z");

test("publication chronology sorts mixed articles and news without mutating source", () => {
  assert.deepEqual(selectBlogPosts(posts, "fa", { now }).map(p => p.slug), ["new", "middle", "old"]);
  assert.deepEqual(selectBlogPosts(posts, "en", { now, sort: "oldest" }).map(p => p.slug), ["old", "middle", "new"]);
  assert.deepEqual(posts.map(p => p.slug), ["old", "new", "middle"]);
});
test("type, search and chronology compose; Arabic letters and Persian spacing normalize", () => {
  assert.equal(normalizeSearch("  تحصيلي كاربردي  "), "تحصیلی کاربردی");
  assert.deepEqual(selectBlogPosts(posts, "fa", { now, type: "news", query: "تحصيلي" }).map(p => p.slug), ["new"]);
  assert.equal(selectBlogPosts(posts, "fa", { now, query: "آماده سازی" }).length, 3);
  assert.equal(selectBlogPosts(posts, "en", { now, query: "PREPARE" }).length, 3);
  assert.equal(selectBlogPosts(posts, "fa", { now, query: "بی‌نتیجه" }).length, 0);
});
test("future and invalid publication dates are not shown", () => {
  assert.equal(selectBlogPosts([post("future", "2030-01-01"), post("invalid", "unknown"), posts[0]], "fa", { now }).length, 1);
  assert.deepEqual(selectBlogPosts([], "fa", { now }), []);
});
test("timestamps use actual instants; ties have deterministic ordering", () => {
  const values = [post("b", "2026-09-20T12:00:00+03:30"), post("a", "2026-09-20T09:00:00Z"), post("c", "2026-09-20T09:00:00Z")];
  assert.deepEqual(selectBlogPosts(values, "en", { now }).map(p => p.slug), ["a", "c", "b"]);
});
test("Persian dates use the Persian calendar and links preserve type and locale", () => {
  assert.match(blogDate("2026-09-22", "fa"), /۱۴۰۵/);
  assert.match(blogDate("2026-09-22", "en"), /2026/);
  assert.equal(blogHref(posts[1], "fa"), "/fa/news/new");
  assert.equal(blogHref(posts[0], "en"), "/en/articles/old");
});

test("guides are independently filterable, chronological and have bilingual reading pages", () => {
  const selected = selectBlogPosts([...posts, ...blogGuides], "fa", { now, type: "guide" });
  assert.equal(selected.length, 3);
  assert.deepEqual(selected.map(p=>p.date), ["2026-09-17", "2026-09-16", "2026-09-15"]);
  for (const guide of selected) {
    assert.equal(blogHref(guide,"fa"), `/fa/guides/${guide.slug}`);
    for (const locale of ["fa","en"]) {
      assert.ok(guide.title[locale]);
      assert.equal(guide.sections[locale].length, 3);
      assert.ok(guide.sections[locale].every(section=>section.title && section.body));
    }
  }
  assert.equal(selectBlogPosts(blogGuides,"fa",{now,type:"article"}).length,0);
  assert.equal(new Set(blogGuides.map(g=>g.slug)).size,blogGuides.length);
  assert.equal(blogFaq.fa.length,blogFaq.en.length);
});
