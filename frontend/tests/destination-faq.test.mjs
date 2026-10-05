import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { destinations } from "../lib/destination-content.ts";
import { destinationFaqs } from "../lib/destination-faqs.ts";

test("all ten destination guides have five distinct bilingual questions with official sources", () => {
  assert.deepEqual(Object.keys(destinationFaqs).sort(), destinations.map(({ slug }) => slug).sort());
  const hosts = new Set(["www.educanada.ca", "www.canada.ca", "www.make-it-in-germany.com", "www.gov.uk", "www.universitaly.it", "www.studyinnl.org", "ind.nl", "www.studyaustralia.gov.au", "www.universityadmissions.se", "www.migrationsverket.se", "www.studyinfinland.fi", "studyindenmark.dk", "www.nyidanmark.dk", "www.immigration.govt.nz"]);
  for (const [slug, items] of Object.entries(destinationFaqs)) {
    assert.equal(items.length, 5, slug);
    for (const locale of ["fa", "en"]) {
      assert.equal(new Set(items.map((item) => item.question[locale])).size, 5, slug);
      for (const item of items) {
        assert.ok(item.question[locale].trim() && item.answer[locale].trim(), `${slug}.${locale}`);
        assert.notEqual(item.question.fa, item.question.en);
        assert.notEqual(item.answer.fa, item.answer.en);
      }
    }
    for (const { source } of items) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(hosts.has(url.hostname), `Unexpected source ${source.url}`);
      assert.ok(source.name.trim());
    }
  }
});

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(new URL("../components/destination-faq.tsx", import.meta.url), "utf8");
for (const locale of ["fa", "en"]) test(`destination FAQ supports one open answer, closing and linked accessible sources in ${locale}`, () => {
  let state = null;
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, {
    module, exports: module.exports,
    require(name) {
      if (name.endsWith(".module.css")) return {};
      if (name === "react") return { useId: () => "faq", useState: () => [state, (update) => { state = update(state); }] };
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      throw new Error(name);
    },
  });
  const items = destinationFaqs.canada;
  const render = () => module.exports.DestinationFaq({ items, locale }).props.children;
  const button = (row) => row.props.children[0].props.children.props;
  const answer = (row) => row.props.children[1].props;
  let rows = render();
  assert.ok(rows.every((row) => answer(row).inert && !button(row)["aria-expanded"]));
  assert.equal(button(rows[0]).children[1].props.children, items[0].question[locale]);
  button(rows[0]).onClick();
  rows = render();
  assert.equal(button(rows[0])["aria-expanded"], true);
  assert.equal(answer(rows[0]).inert, false);
  assert.equal(button(rows[0])["aria-controls"], answer(rows[0]).id);
  assert.equal(answer(rows[0])["aria-labelledby"], button(rows[0]).id);
  const copy = answer(rows[0]).children.props.children.props.children;
  assert.equal(copy[0].props.children, items[0].answer[locale]);
  assert.equal(copy[1].props.href, items[0].source.url);
  assert.equal(copy[1].props.rel, "noopener noreferrer");
  button(rows[1]).onClick();
  rows = render();
  assert.equal(answer(rows[0]).inert, true);
  assert.equal(answer(rows[1])["aria-hidden"], false);
  button(rows[1]).onClick();
  assert.ok(render().every((row) => answer(row).inert));
});
