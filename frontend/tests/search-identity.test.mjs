import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
function load(path, dependencies = {}) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { module, exports: module.exports, URL, require: name => dependencies[name] ?? {} });
  return module.exports;
}
const content = load("lib/site-content.ts");
const seo = load("lib/site-seo.ts", { "./seo-copy": load("lib/seo-copy.ts") });
const routes = load("app/[locale]/[...segments]/page.tsx", { "@/lib/site-content": content, "@/lib/site-seo": seo });

test("each editorial detail identifies itself instead of inheriting home metadata", async () => {
  for (const locale of ["fa", "en"]) for (const article of content.articles) {
    const segments = [article.type === "news" ? "news" : "articles", article.slug];
    const metadata = await routes.generateMetadata({ params: Promise.resolve({ locale, segments }) });
    assert.equal(metadata.title, `${article.title[locale]} | Jahan Academy`);
    assert.equal(metadata.description, article.excerpt[locale]);
    assert.equal(metadata.alternates.canonical, `https://jahanacademi.ir/${locale}/${segments.join("/")}`);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.alternates.languages.en, `https://jahanacademi.ir/en/${segments.join("/")}`);
  }
});

test("journal archive has its own canonical URL", async () => {
  const blog = load("lib/blog-content.ts");
  const route = load("app/[locale]/articles/page.tsx", { "@/lib/site-content": content, "@/lib/site-seo": seo, "@/lib/blog-content": blog });
  for (const locale of ["fa", "en"]) {
    const metadata = await route.generateMetadata({ params: Promise.resolve({ locale }) });
    assert.equal(metadata.alternates.canonical, `https://jahanacademi.ir/${locale}/articles`);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  }
});

test("site identity uses a single domain and references the existing organization", () => {
  const schema = seo.websiteSchema();
  assert.equal(schema["@type"], "WebSite");
  assert.equal(schema.url, "https://jahanacademi.ir/");
  assert.equal(schema.name, "جهان آکادمی");
  assert.ok(schema.alternateName.includes("Jahan Academy"));
  assert.equal(schema.publisher["@id"], seo.organizationSchema()["@id"]);
  assert.equal(schema.potentialAction, undefined);
});

test("sitemap includes the canonical journal rather than duplicate archive aliases", () => {
  const { default: sitemap } = load("app/sitemap.ts", { "@/lib/blog-guides": { blogGuides: [] }, "@/lib/destination-content": { destinations: [] }, "@/lib/home-universities": { homeUniversities: [] }, "@/lib/site-content": content, "@/lib/site-seo": seo });
  const urls = sitemap().map(item => item.url);
  for (const locale of ["fa", "en"]) {
    assert.ok(urls.includes(`https://jahanacademi.ir/${locale}/articles`));
    assert.ok(!urls.includes(`https://jahanacademi.ir/${locale}/news`));
    assert.ok(!urls.includes(`https://jahanacademi.ir/${locale}/guides`));
  }
});
