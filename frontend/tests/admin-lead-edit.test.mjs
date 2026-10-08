import assert from "node:assert/strict";
import test from "node:test";
import { leadEditData, leadEditPayload, leadCell } from "../lib/admin-leads.ts";
import { resources, formData, writePayload } from "../lib/admin-resources.ts";

const resource = resources.find((item) => item.id === "leads");
const edit = (original, changes) => {
  const data = { ...formData(resource.fields, leadEditData(original)), ...changes };
  return leadEditPayload(data, original, writePayload(resource, data, original, false));
};

test("separate assessment edits preserve other answers, CRLF and unstructured notes", () => {
  const original = { firstName: "Test", lastName: "User", mobile: "+989123456789", message: "تحصیلات: لیسانس\r\nسرمایه مهاجرت: ۲ میلیارد\r\nمهارت زبان انگلیسی: متوسط\r\nزمان تماس: عصر" };
  const payload = edit(original, { education: "فوق لیسانس" });
  assert.equal(payload.message, "تحصیلات: فوق لیسانس\r\nسرمایه مهاجرت: ۲ میلیارد\r\nمهارت زبان انگلیسی: متوسط\r\nزمان تماس: عصر");
  assert.equal(leadCell(payload, "education"), "فوق لیسانس");
  for (const key of ["education", "assessmentBudget", "englishProficiency"]) assert.equal(key in payload, false);
});

test("editing basic fields does not rewrite or clear a consultation message", () => {
  for (const message of [null, "تماس بعد از ظهر\nEducation: follow up", "Education: Degree\nMigration budget: 1–2 billion toman\nEnglish proficiency: Excellent"]) {
    const payload = edit({ message }, { occupation: "Engineer" });
    assert.equal("message" in payload, false);
  }
  assert.equal(resource.fields.some((field) => field.key === "message"), false);
});

test("new assessment answers use the record language and clearing one preserves the others", () => {
  assert.equal(edit({ locale: "en", message: "Call me later" }, { education: "Degree" }).message, "Call me later\nEducation: Degree");
  assert.equal(edit({ message: "تحصیلات: لیسانس\nمهارت زبان انگلیسی: عالی" }, { education: "" }).message, "تحصیلات: \nمهارت زبان انگلیسی: عالی");
  assert.throws(() => edit({}, { education: "degree\nسرمایه مهاجرت: fake" }));
  assert.throws(() => edit({}, { education: "x".repeat(2000) }));
});

test("structured investment budgets retain their API shape and currency", () => {
  const original = { investmentRangeCode: "10k_20k", investmentCurrency: "EUR", message: "Call me" };
  const payload = edit(original, { investmentRangeCode: "20k_40k", investmentCurrency: "EUR" });
  assert.deepEqual(payload.investmentBudget, { rangeCode: "20k_40k", currency: "EUR" });
  assert.equal("investmentRangeCode" in payload, false);
  assert.equal("message" in payload, false);
});

test("changing gender removes a stale self-description from the patch", () => {
  const original = { gender: "self_described", genderSelfDescription: "Custom" };
  const body = edit(original, { gender: "male", genderSelfDescription: "Custom" });
  assert.equal("genderSelfDescription" in body, false);
  assert.equal(body.gender, "male");
  assert.equal(edit({}, { gender: "self_described", genderSelfDescription: "Custom" }).genderSelfDescription, "Custom");
});
