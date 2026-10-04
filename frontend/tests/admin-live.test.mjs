import assert from "node:assert/strict";
import test from "node:test";
import { startLiveRefresh } from "../lib/admin-live.ts";
import { leadCell, newLeadIds } from "../lib/admin-leads.ts";

const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

test("polling receives submissions without reload and never overlaps requests", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let resolve;
  let calls = 0;
  const received = [];
  const live = startLiveRefresh({
    load: () => { calls++; return new Promise((r) => { resolve = r; }); },
    onData: (value) => received.push(value), onError: assert.fail, active: () => true,
  });
  t.after(() => live.stop());
  await live.refresh();
  t.mock.timers.tick(10000);
  assert.equal(calls, 1);
  resolve([]); await settle();
  t.mock.timers.tick(2000);
  assert.equal(calls, 2);
  resolve([{ id: "new-assessment" }]); await settle();
  assert.deepEqual(received, [[], [{ id: "new-assessment" }]]);
});

test("hidden tabs pause and resume; disposing aborts and rejects late results", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let active = false;
  let calls = 0;
  let resolve;
  let signal;
  const received = [];
  const live = startLiveRefresh({
    load: (s) => { signal = s; calls++; return new Promise((r) => { resolve = r; }); },
    onData: (x) => received.push(x), onError: assert.fail, active: () => active,
  });
  assert.equal(calls, 0);
  active = true; void live.refresh();
  assert.equal(calls, 1);
  live.stop();
  assert.equal(signal.aborted, true);
  resolve(["late"]); await settle(); t.mock.timers.tick(30000);
  assert.deepEqual(received, []);
  assert.equal(calls, 1);
});

test("network failures back off and recovery returns to two-second refresh", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  let errors = 0;
  const received = [];
  const live = startLiveRefresh({
    load: async () => { calls++; if (calls <= 2) throw new Error("offline"); return "current"; },
    onData: (x) => received.push(x), onError: () => errors++, active: () => true,
  });
  t.after(() => live.stop());
  await settle(); t.mock.timers.tick(3999); assert.equal(calls, 1);
  t.mock.timers.tick(1); await settle(); assert.equal(calls, 2);
  t.mock.timers.tick(7999); assert.equal(calls, 2);
  t.mock.timers.tick(1); await settle(); assert.equal(calls, 3);
  assert.equal(errors, 2); assert.deepEqual(received, ["current"]);
  t.mock.timers.tick(2000); await settle(); assert.equal(calls, 4);
});

test("table retains free-text destinations and distinguishes new records from updates", () => {
  const row = { id: "1", firstName: "نام", lastName: "آزمایشی", desiredCountryText: "کانادا" };
  assert.equal(leadCell(row, "fullName"), "نام آزمایشی");
  assert.equal(leadCell(row, "desiredCountryName"), "کانادا");
  assert.equal(leadCell({ ...row, desiredCountryName: "Canada" }, "desiredCountryName"), "Canada");
  assert.deepEqual(newLeadIds(null, [row]), []);
  assert.deepEqual(newLeadIds([row], [{ ...row, version: 2 }, { id: "2" }]), ["2"]);
  assert.equal(leadCell({ createdAt: "invalid" }, "createdAt"), "—");
});

test("assessment columns read exact Persian and English form lines, without guessing missing values", () => {
  const fa = { message: "تحصیلات: لیسانس\r\nسرمایه مهاجرت: ۱ الی ۲ میلیارد\r\nمهارت زبان انگلیسی: متوسط" };
  assert.equal(leadCell(fa, "education"), "لیسانس");
  assert.equal(leadCell(fa, "investmentBudget"), "۱ الی ۲ میلیارد");
  assert.equal(leadCell(fa, "englishProficiency"), "متوسط");
  const en = { message: "Education: Bachelor's degree\nMigration budget: 1–2 billion toman\nEnglish proficiency: Intermediate" };
  assert.equal(leadCell(en, "education"), "Bachelor's degree");
  assert.equal(leadCell(en, "investmentBudget"), "1–2 billion toman");
  assert.equal(leadCell(en, "englishProficiency"), "Intermediate");
  assert.equal(leadCell({ message: "I want to discuss Education: later" }, "education"), undefined);
  assert.equal(leadCell({ message: null }, "englishProficiency"), undefined);
  assert.equal(leadCell({ message: "تحصیلات: " }, "education"), undefined);
});

test("demographics are localized and structured budgets retain their currency", () => {
  assert.equal(leadCell({ gender: "male" }, "gender"), "مرد");
  assert.equal(leadCell({ maritalStatus: "married" }, "maritalStatus"), "متأهل");
  assert.equal(leadCell({ gender: "prefer_not_to_say" }, "gender"), "تمایلی به پاسخ ندارم");
  assert.equal(leadCell({ age: 29 }, "age"), 29);
  assert.equal(leadCell({ investmentRangeCode: "10k_20k", investmentCurrency: "EUR", message: "سرمایه مهاجرت: قدیمی" }, "investmentBudget"), "۱۰٬۰۰۰ تا ۲۰٬۰۰۰ · EUR");
  assert.equal(leadCell({ investmentRangeCode: "custom-range" }, "investmentBudget"), "custom-range");
});


test("request types distinguish both assessment locales from consultation messages", () => {
  for (const message of [
    "تحصیلات: لیسانس\r\nسرمایه مهاجرت: ۱ الی ۲ میلیارد\r\nمهارت زبان انگلیسی: متوسط",
    "Education: Bachelor's degree\nMigration budget: 1–2 billion toman\nEnglish proficiency: Intermediate",
  ]) {
    assert.equal(leadCell({ message }, "requestType"), "ارزیابی");
  }
  for (const message of [null, "", "درباره تحصیلات سؤال دارم", "Education: degree", "Education: degree\nMigration budget: \nEnglish proficiency: Intermediate"]) {
    assert.equal(leadCell({ message }, "requestType"), "مشاوره");
  }
  const createdAt = "2026-10-04T09:00:00Z";
  assert.equal(leadCell({ createdAt }, "requestCreatedAt"), leadCell({ createdAt }, "createdAt"));
  assert.equal(leadCell({}, "requestCreatedAt"), "—");
  assert.equal(leadCell({ status: "closed" }, "status"), "closed");
});
