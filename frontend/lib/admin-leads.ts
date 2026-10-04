import type { RecordData } from "./admin-api";

export function leadDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fa-IR", {
    dateStyle: "short", timeStyle: "short",
  });
}

export function leadCell(row: RecordData, column: string): unknown {
  if (column === "fullName") return [row.firstName, row.lastName].filter(Boolean).join(" ");
  if (column === "desiredCountryName") return row.desiredCountryName || row.desiredCountryText;
  if (["createdAt", "updatedAt", "lastDuplicateAt", "archivedAt", "syncLastAttemptAt", "syncSyncedAt"].includes(column)) return leadDate(row[column]);
  return row[column];
}

export function newLeadIds(previous: RecordData[] | null, next: RecordData[]): string[] {
  if (!previous) return [];
  const known = new Set(previous.map((row) => String(row.id)));
  return next.filter((row) => !known.has(String(row.id))).map((row) => String(row.id));
}
