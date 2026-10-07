export type Calendar = "persian" | "gregory";
const dayMs = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(calendar: Calendar, timeZone = "UTC") {
  const key = `${calendar}:${timeZone}`;
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat("en-US", {
    calendar, timeZone, year: "numeric", month: "numeric", day: "numeric",
  }));
  return formatters.get(key)!;
}

export function calendarParts(date: Date, calendar: Calendar, timeZone = "UTC") {
  const parts = formatter(calendar, timeZone).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
export function fromKey(key: string): Date { return new Date(`${key}T00:00:00Z`); }
export function addDays(date: Date, days: number): Date { return new Date(date.getTime() + days * dayMs); }
export function todayKey(now = new Date()): string {
  const { year, month, day } = calendarParts(now, "gregory", "Asia/Tehran");
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Invert the runtime's calendar conversion instead of maintaining a second leap-year algorithm.
export function monthStart(calendar: Calendar, year: number, month: number): Date {
  const normalizedYear = year + Math.floor((month - 1) / 12);
  const normalizedMonth = ((month - 1) % 12 + 12) % 12 + 1;
  if (calendar === "gregory") return new Date(Date.UTC(normalizedYear, normalizedMonth - 1, 1));
  let low = Math.floor(Date.UTC(normalizedYear + 621, 0, 1) / dayMs);
  let high = Math.floor(Date.UTC(normalizedYear + 623, 0, 1) / dayMs);
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const parts = calendarParts(new Date(middle * dayMs), calendar);
    if (parts.year < normalizedYear || (parts.year === normalizedYear && parts.month < normalizedMonth)) low = middle + 1;
    else high = middle;
  }
  return new Date(low * dayMs);
}

export function monthDays(calendar: Calendar, year: number, month: number): Date[] {
  const first = monthStart(calendar, year, month);
  const offset = (first.getUTCDay() + (calendar === "persian" ? 1 : 0)) % 7;
  return Array.from({ length: 42 }, (_, index) => addDays(first, index - offset));
}

export function calendarLabel(date: Date, calendar: Calendar, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(calendar === "persian" ? "fa-IR" : "en-US", {
    calendar, timeZone: "UTC", year: "numeric", month: "long", day: "numeric", ...options,
  }).format(date);
}

function tehranDayStart(key: string): number {
  // Find the first instant of a Tehran civil day, including historical DST transitions.
  const nominal = fromKey(key).getTime();
  let low = nominal - dayMs;
  let high = nominal + dayMs;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (todayKey(new Date(middle)) < key) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function dateRangeParams(from: string, to: string): Record<string, string> {
  if (from && to && from > to) throw new Error("تاریخ شروع نباید بعد از تاریخ پایان باشد.");
  const params: Record<string, string> = {};
  if (from) params.from = new Date(tehranDayStart(from)).toISOString();
  // The existing API uses <= and PostgreSQL timestamps have microsecond precision.
  if (to) params.to = new Date(tehranDayStart(dateKey(addDays(fromKey(to), 1))) - 1).toISOString().replace(".999Z", ".999999Z");
  return params;
}
