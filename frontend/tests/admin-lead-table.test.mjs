import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith("./") && !specifier.endsWith(".ts") && context.parentURL?.includes("/lib/admin-")) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
const { columnText, columnValues, filterLeadRows, loadAllLeadRows } = await import("../lib/admin-lead-table.ts");
const { leadWorkbook } = await import("../lib/admin-lead-export.ts");
const { resources } = await import("../lib/admin-resources.ts");

test("column filters intersect, use displayed values and exclude their own filter from options", () => {
  const rows = [{ id: "1", firstName: "Amin", lastName: "A", status: "closed", mobile: "+989123456789" }, { id: "2", firstName: "Mina", lastName: "B", status: "new", mobile: "+989123456789" }, { id: "3", firstName: "Mina", lastName: "B", status: "closed", mobile: "+989109876543" }];
  assert.equal(columnText(rows[0], "mobile"), "+98 912 345 6789");
  assert.equal(columnText(rows[0], "status"), "بسته‌شده");
  assert.deepEqual(filterLeadRows(rows, { fullName: ["Mina B"], status: ["جدید"] }).map(row => row.id), ["2"]);
  assert.deepEqual(columnValues(rows, "status", { fullName: ["Mina B"], status: ["جدید"] }), ["بسته‌شده", "جدید"]);
  assert.deepEqual(filterLeadRows(rows, { email: ["—"] }), rows);
  assert.deepEqual(filterLeadRows(rows, { status: [] }), []);
});

test("all-page loading preserves server scope/search and returns records beyond page one", async () => {
  const rows = Array.from({ length: 205 }, (_, i) => ({ id: String(i), status: i === 204 ? "closed" : "new" }));
  const calls = [];
  const result = await loadAllLeadRows(new URLSearchParams({ page: "8", q: "Amin", searchField: "fullName", from: "2026-01-01", status: "new" }), async params => {
    calls.push(Object.fromEntries(params));
    const start = (Number(params.get("page")) - 1) * 100;
    return { data: rows.slice(start, start + 100), meta: { total: rows.length } };
  });
  assert.equal(result.length, 205);
  assert.deepEqual(calls.map(call => call.page), ["1", "2", "3"]);
  assert.ok(calls.every(call => call.limit === "100" && call.q === "Amin" && call.searchField === "fullName" && call.from === "2026-01-01" && call.status === "new"));
  assert.deepEqual(filterLeadRows(result, { status: ["بسته‌شده"] }).map(row => row.id), ["204"]);
});

test("partial, changed and failed data never produce a partial export", async () => {
  await assert.rejects(loadAllLeadRows(new URLSearchParams(), async () => ({ data: [], meta: { total: 1 } })));
  let page = 0;
  await assert.rejects(loadAllLeadRows(new URLSearchParams(), async () => ({ data: [{ id: "same" }], meta: { total: ++page === 1 ? 2 : 1 } })));
  await assert.rejects(loadAllLeadRows(new URLSearchParams(), async () => ({ data: [{ id: "same" }], meta: { total: 2 } })));
  await assert.rejects(loadAllLeadRows(new URLSearchParams(), async () => { throw new Error("forbidden"); }), /forbidden/);
  assert.deepEqual(await loadAllLeadRows(new URLSearchParams(), async () => ({ data: [], meta: { total: 0 } })), []);
});

test("Excel roundtrip keeps RTL columns, text phone/formula payloads, filters and banding", async () => {
  const { default: ExcelJS } = await import("exceljs");
  const columns = resources.find(resource => resource.id === "leads").columns;
  const rows = [{ id: "1", reference: "JA-ONE", firstName: "=1+1", lastName: "Test", mobile: "+989123456789", age: 30, status: "closed" }, { id: "2", reference: "JA-TWO", firstName: "Amin", status: "new" }];
  const buffer = await leadWorkbook(rows, columns);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  assert.equal(sheet.rowCount, 3);
  assert.equal(sheet.columnCount, 14);
  assert.equal(sheet.views[0].rightToLeft, true);
  assert.equal(sheet.getCell("A1").value, "کد پیگیری");
  assert.equal(sheet.getCell("N1").value, "وضعیت");
  assert.equal(sheet.getCell("C2").value, "+98 912 345 6789");
  assert.equal(sheet.getCell("B2").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("B2").value, "=1+1 Test");
  assert.equal(sheet.getCell("N2").value, "بسته‌شده");
  assert.equal(sheet.getCell("A1").alignment.horizontal, "center");
  assert.equal(sheet.getCell("A1").fill.fgColor.argb, "FF123B78");
  assert.equal(sheet.getCell("A1").font.color.argb, "FFFFFFFF");
  assert.notEqual(sheet.getCell("A2").fill.fgColor.argb, sheet.getCell("A3").fill.fgColor.argb);
  assert.ok(sheet.autoFilter);
  const empty = new ExcelJS.Workbook();
  await empty.xlsx.load(await leadWorkbook([], columns));
  assert.equal(empty.worksheets[0].rowCount, 1);
});
