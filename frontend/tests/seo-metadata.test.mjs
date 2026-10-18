import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
function load(name, dependencies = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module, exports: module.exports, URL, require: name => dependencies[name] });
  return module.exports;
}
const copy = load("seo-copy");
const { pageMetadata } = load("site-seo", { "./seo-copy": copy });
const countries = ["canada", "germany", "united-kingdom", "italy", "netherlands", "australia", "sweden", "finland", "denmark", "new-zealand"];

test("audit snippets are unique, complete and consistent across metadata surfaces", () => {
  const descriptions = new Set();
  for (const locale of ["fa", "en"]) {
    const paths = [...Object.keys(copy.seoCopy), ...countries.map(slug => `/countries/${slug}`)];
    for (const path of paths) {
      const entry = copy.getSeoCopy(locale, path);
      if (!entry) continue;
      assert.ok(entry.description.length >= 70 && entry.description.length <= 160, `${locale}${path}: ${entry.description.length}`);
      assert.ok(!descriptions.has(entry.description), `duplicate ${locale}${path}`);
      descriptions.add(entry.description);
      const metadata = pageMetadata(locale, path, "Page title", "Fallback description");
      assert.equal(metadata.description, entry.description);
      assert.equal(metadata.openGraph.description, metadata.description);
      assert.equal(metadata.twitter.description, metadata.description);
      assert.equal(metadata.alternates.canonical, `https://jahanacademi.ir/${locale}${path}`);
      assert.equal(metadata.alternates.languages.en, `https://jahanacademi.ir/en${path}`);
    }
  }
  assert.equal(descriptions.size, 52);
  assert.notEqual(pageMetadata("fa", "", "Fallback").title, pageMetadata("en", "", "Fallback").title);
});

test("pages outside the audit retain their explicit metadata", () => {
  const metadata = pageMetadata("fa", "/guides/germany-study-residence-guide", "Guide title", "Guide description");
  assert.equal(metadata.title, "Guide title");
  assert.equal(metadata.description, "Guide description");
  assert.equal(metadata.alternates.canonical, "https://jahanacademi.ir/fa/guides/germany-study-residence-guide");
});
