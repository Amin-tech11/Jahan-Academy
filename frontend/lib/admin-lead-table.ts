import { displayValue, rowsOf, totalOf, type RecordData } from "./admin-api";
import { leadCell } from "./admin-leads";
import { labels } from "./admin-resources";

export type ColumnFilters = Record<string, string[]>;
export type ColumnSort = { column: string; direction: "asc" | "desc" };
const sortCollator = new Intl.Collator("fa", { numeric: true, sensitivity: "base" });
export function sortLeadRows(rows: RecordData[], sort: ColumnSort | null): RecordData[] {
  if (!sort) return rows;
  const key = (row: RecordData): string | number | null => {
    if (sort.column === "requestCreatedAt") {
      const time = row.createdAt ? new Date(String(row.createdAt)).getTime() : NaN;
      return Number.isFinite(time) ? time : null;
    }
    if (sort.column === "age") return row.age == null || row.age === "" ? null : Number.isFinite(Number(row.age)) ? Number(row.age) : null;
    const text = columnText(row, sort.column);
    if (sort.column === "investmentBudget" && text !== "—") {
      const normalized = text.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[٬,]/g, "");
      const number = normalized.match(/\d+(?:\.\d+)?/);
      if (number) return /کمتر|under/i.test(normalized) ? 0 : Number(number[0]) * (/میلیارد|billion/i.test(normalized) ? 1e9 : /میلیون|million/i.test(normalized) ? 1e6 : 1);
    }
    return text === "—" ? null : text;
  };
  return [...rows].sort((a, b) => {
    const first = key(a), second = key(b);
    // Missing answers remain last in either direction; ties retain server order.
    if (first === null || second === null) return first === second ? 0 : first === null ? 1 : -1;
    const result = typeof first === "number" && typeof second === "number" ? first - second : sortCollator.compare(String(first), String(second));
    return sort.direction === "asc" ? result : -result;
  });
}
export function columnText(row: RecordData, column: string): string {
  const value = displayValue(leadCell(row, column));
  return column === "status" ? labels[value] ?? value : value;
}
export function filterLeadRows(rows: RecordData[], filters: ColumnFilters): RecordData[] {
  return rows.filter(row => Object.entries(filters).every(([column, values]) => values.includes(columnText(row, column))));
}
export function columnValues(rows: RecordData[], column: string, filters: ColumnFilters): string[] {
  const otherFilters = Object.fromEntries(Object.entries(filters).filter(([key]) => key !== column));
  return [...new Set(filterLeadRows(rows, otherFilters).map(row => columnText(row, column)))].sort((a, b) => a.localeCompare(b, "fa", { numeric: true }));
}
/** Use the same permission-scoped endpoint. Never return a partial export on failure. */
export async function loadAllLeadRows(params: URLSearchParams, load: (params: URLSearchParams) => Promise<RecordData>): Promise<RecordData[]> {
  const query = new URLSearchParams(params);
  query.set("limit", "100");
  const result: RecordData[] = [];
  let total = Infinity;
  for (let page = 1; result.length < total; page++) {
    query.set("page", String(page));
    const response = await load(new URLSearchParams(query));
    const rows = rowsOf(response);
    const receivedTotal = totalOf(response);
    if (page > 1 && receivedTotal !== total) throw new Error("جدول هنگام دریافت تغییر کرد؛ دوباره تلاش کنید.");
    total = receivedTotal;
    if (!rows.length && result.length < total) throw new Error("دریافت همه رکوردها کامل نشد؛ دوباره تلاش کنید.");
    result.push(...rows);
  }
  if (new Set(result.map(row => String(row.id))).size !== total || result.length !== total) throw new Error("جدول هنگام دریافت تغییر کرد؛ دوباره تلاش کنید.");
  return result;
}
