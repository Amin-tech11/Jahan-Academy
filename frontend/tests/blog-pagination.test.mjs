import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as content from "../lib/blog-content.ts";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL("../components/blog-archive.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount(sectionType, posts) {
  let page = 1;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === "react") return { useState: () => [page, value => { page = value; }] };
    if (name === "@/lib/blog-content") return content;
    if (name === "next/link" || name === "next/image") return { default: name };
    return require(name);
  } });
  return () => module.exports.BlogArchive({ posts, locale: "en", sectionType });
}

function elements(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(elements);
  return [tree, ...elements(tree.props?.children)];
}

test("archives paginate six items independently, with numbered pages and bounded arrows", () => {
  const posts = ["news", "article", "guide"].flatMap(type => Array.from({ length: 13 }, (_, index) => ({
    type, slug: `${type}-${index}`, date: `2020-01-${String(index + 1).padStart(2, "0")}`,
    title: { fa: "نمونه", en: "Sample" }, excerpt: { fa: "نمونه", en: "Sample" },
  })));
  const news = mount("news", posts);
  const guides = mount("guide", posts);
  const cards = render => elements(render()).filter(element => element.type === "article");
  const button = (render, label) => elements(render()).find(element => element.type === "button" && element.props["aria-label"] === label);
  assert.equal(cards(news).length, 6);
  assert.equal(button(news, "Previous").props.disabled, true);
  button(news, "Page 2").props.onClick();
  assert.equal(cards(news).length, 6);
  assert.equal(cards(news)[0].key, "news-6");
  assert.equal(cards(guides)[0].key, "guide-12");
  button(news, "Next").props.onClick();
  assert.equal(cards(news).length, 1);
  assert.equal(button(news, "Next").props.disabled, true);
  button(news, "Previous").props.onClick();
  assert.equal(cards(news).length, 6);
});
