import type { RecordData } from "./admin-api";

const assessmentLabels: Record<string, string[]> = {
  education: ["تحصیلات", "Education"],
  investmentBudget: ["سرمایه مهاجرت", "Migration budget"],
  englishProficiency: ["مهارت زبان انگلیسی", "English proficiency"],
};
const choiceLabels: Record<string, string> = {
  female: "زن", male: "مرد", non_binary: "غیردودویی", self_described: "توصیف شخصی",
  prefer_not_to_say: "تمایلی به پاسخ ندارم", single: "مجرد", married: "متأهل",
  divorced: "جداشده", widowed: "همسر فوت‌شده",
  under_10k: "کمتر از ۱۰٬۰۰۰", "10k_20k": "۱۰٬۰۰۰ تا ۲۰٬۰۰۰",
  "20k_40k": "۲۰٬۰۰۰ تا ۴۰٬۰۰۰", "40k_plus": "بیش از ۴۰٬۰۰۰",
};

function assessmentValue(message: unknown, column: string): string | undefined {
  if (typeof message !== "string") return undefined;
  for (const line of message.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    if (assessmentLabels[column]?.includes(line.slice(0, separator).trim())) {
      return line.slice(separator + 1).trim() || undefined;
    }
  }
  return undefined;
}

export function leadDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fa-IR", {
    dateStyle: "short", timeStyle: "short",
  });
}

export function leadCell(row: RecordData, column: string): unknown {
  if (column === "mobile" && typeof row.mobile === "string") {
    return row.mobile.replace(/^(\+98)(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3 $4");
  }
  if (column === "fullName") return [row.firstName, row.lastName].filter(Boolean).join(" ");
  if (column === "desiredCountryName") return row.desiredCountryName || row.desiredCountryText;
  if (column === "gender" || column === "maritalStatus") {
    if (column === "gender" && row.gender === "self_described" && row.genderSelfDescription) return row.genderSelfDescription;
    return choiceLabels[String(row[column])] ?? row[column];
  }
  if (column === "investmentBudget" && row.investmentRangeCode) {
    return [choiceLabels[String(row.investmentRangeCode)] ?? row.investmentRangeCode, row.investmentCurrency].filter(Boolean).join(" · ");
  }
  if (column in assessmentLabels) return assessmentValue(row.message, column);
  if (["createdAt", "updatedAt", "lastDuplicateAt", "archivedAt", "syncLastAttemptAt", "syncSyncedAt"].includes(column)) return leadDate(row[column]);
  return row[column];
}

export function newLeadIds(previous: RecordData[] | null, next: RecordData[]): string[] {
  if (!previous) return [];
  const known = new Set(previous.map((row) => String(row.id)));
  return next.filter((row) => !known.has(String(row.id))).map((row) => String(row.id));
}
