import assert from "node:assert/strict";
import test from "node:test";
import { leadSearchFields, leadSearchParams } from "../lib/admin-lead-search.ts";

test("consultation search sends only the selected column with the query", () => {
  for (const { value } of leadSearchFields) {
    assert.deepEqual(leadSearchParams("  Mina Ahmadi  ", value), { q: "Mina Ahmadi", searchField: value });
  }
  assert.deepEqual(leadSearchParams("+98 912 345 6789", "mobile"), { q: "+98 912 345 6789", searchField: "mobile" });
});

test("cleared and short searches omit both search parameters", () => {
  for (const { value } of leadSearchFields) {
    assert.deepEqual(leadSearchParams(" ", value), {});
    assert.deepEqual(leadSearchParams("  M ", value), {});
  }
});
