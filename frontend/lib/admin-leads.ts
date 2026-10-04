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
  if (column === "requestCreatedAt") return leadDate(row.createdAt);
  if (column === "requestType") {
    // Legacy assessment submissions store these three required, labeled answers.
    const isAssessment = typeof row.message === "string"
      && row.message.trim().split(/\r?\n/).length === 3
      && Object.keys(assessmentLabels).every((key) => assessmentValue(row.message, key));
    return isAssessment ? "ارزیابی" : "مشاوره";
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

const editAnswers: Record<string, string> = {
  education: "education", assessmentBudget: "investmentBudget", englishProficiency: "englishProficiency",
};

export function leadEditData(row: RecordData): RecordData {
  const data = { ...row };
  for (const [field, column] of Object.entries(editAnswers)) data[field] = assessmentValue(row.message, column) ?? "";
  return data;
}

export function leadEditPayload(data: RecordData, original: RecordData, payload: RecordData): RecordData {
  const result = { ...payload };
  if ("gender" in data && data.gender !== "self_described") delete result.genderSelfDescription;
  let message = typeof original.message === "string" ? original.message : "";
  let messageChanged = false;
  const newline = message.includes("\r\n") ? "\r\n" : "\n";
  for (const [field, column] of Object.entries(editAnswers)) {
    delete result[field];
    if (!(field in data)) continue;
    const next = String(data[field] ?? "").trim();
    if (/[\r\n]/.test(next)) throw new Error("پاسخ‌های ارزیابی باید در یک خط وارد شوند.");
    if (next === (assessmentValue(original.message, column) ?? "")) continue;
    messageChanged = true;
    let found = false;
    const lines = message ? message.split(/\r?\n/) : [];
    message = lines.map((line) => {
      const separator = line.indexOf(":");
      if (separator < 0 || !assessmentLabels[column].includes(line.slice(0, separator).trim())) return line;
      found = true;
      return `${line.slice(0, separator)}: ${next}`;
    }).join(newline);
    if (!found && next) message += `${message ? newline : ""}${assessmentLabels[column][original.locale === "en" ? 1 : 0]}: ${next}`;
  }
  // Unrelated edits never rewrite or erase the original free-form message.
  delete result.message;
  if (messageChanged) {
    if (message.length > 2000) throw new Error("مجموع پاسخ‌ها نباید بیش از ۲۰۰۰ نویسه باشد.");
    result.message = message || null;
  }
  delete result.investmentRangeCode;
  delete result.investmentCurrency;
  if ("investmentRangeCode" in data && (data.investmentRangeCode !== original.investmentRangeCode || data.investmentCurrency !== original.investmentCurrency)) {
    result.investmentBudget = { rangeCode: data.investmentRangeCode, currency: data.investmentCurrency };
  }
  return result;
}
