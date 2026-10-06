import { displayValue, rowsOf, totalOf, type RecordData } from "./admin-api";
import { leadCell } from "./admin-leads";
import { labels } from "./admin-resources";

export type ColumnFilters = Record<string, string[]>;
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
    if (!rows.length && result.length < total) throw new Error("دریافت همهٔ رکوردها کامل نشد؛ دوباره تلاش کنید.");
    result.push(...rows);
  }
  if (new Set(result.map(row => String(row.id))).size !== total || result.length !== total) throw new Error("جدول هنگام دریافت تغییر کرد؛ دوباره تلاش کنید.");
  return result;
}
