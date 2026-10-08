import assert from "node:assert/strict";
import test from "node:test";
import { calendarParts, dateKey, fromKey, monthStart, monthDays, dateRangeParams, todayKey } from "../lib/admin-calendar.ts";

test("Persian months cross Nowruz and leap Esfand without shifting dates", () => {
  assert.equal(dateKey(monthStart("persian", 1405, 1)), "2026-03-21");
  assert.equal(dateKey(monthStart("persian", 1403, 12)), "2025-02-19");
  assert.equal(dateKey(monthStart("persian", 1403, 13)), "2025-03-21");
  assert.deepEqual(calendarParts(fromKey("2025-03-20"), "persian"), { year: 1403, month: 12, day: 30 });
  assert.equal(dateKey(monthStart("persian", 1405, 0)), "2026-02-20");
  assert.equal(dateKey(monthStart("gregory", 2026, 0)), "2025-12-01");
});

test("calendar grids start Saturday for Persian and Sunday for Gregorian", () => {
  const fa = monthDays("persian", 1405, 7);
  const en = monthDays("gregory", 2026, 10);
  assert.equal(fa.length, 42);
  assert.equal(fa[0].getUTCDay(), 6);
  assert.equal(en[0].getUTCDay(), 0);
  assert.equal(dateKey(fa[0]), "2026-09-19");
  assert.equal(dateKey(en[0]), "2026-09-27");
  assert.equal(monthDays("gregory", 2024, 2).filter((d) => calendarParts(d, "gregory").month === 2).length, 29);
});

test("both calendars preserve the same selected civil day", () => {
  for (const key of ["2024-03-20", "2025-03-20", "2026-10-04", "2027-03-21"]) {
    const parts = calendarParts(fromKey(key), "persian");
    const first = monthStart("persian", parts.year, parts.month);
    assert.equal(dateKey(new Date(first.getTime() + (parts.day - 1) * 86400000)), key);
  }
});

test("API date range includes the entire Tehran day with timezone and microsecond precision", () => {
  assert.deepEqual(dateRangeParams("2026-10-04", "2026-10-04"), {
    from: "2026-10-03T20:30:00.000Z", to: "2026-10-04T20:29:59.999999Z",
  });
  assert.deepEqual(dateRangeParams("", ""), {});
  assert.deepEqual(dateRangeParams("2026-10-04", ""), { from: "2026-10-03T20:30:00.000Z" });
  assert.deepEqual(dateRangeParams("", "2026-10-04"), { to: "2026-10-04T20:29:59.999999Z" });
  assert.throws(() => dateRangeParams("2026-10-05", "2026-10-04"));
  assert.equal(todayKey(new Date("2026-10-03T21:00:00Z")), "2026-10-04");
});

test("historical Tehran summer time and midnight transitions are respected", () => {
  assert.equal(dateRangeParams("2021-07-01", "").from, "2021-06-30T19:30:00.000Z");
  assert.equal(dateRangeParams("2021-03-22", "").from, "2021-03-21T20:30:00.000Z");
});
