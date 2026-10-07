export const leadSearchFields = [
  { value: "reference", label: "کد پیگیری", placeholder: "کد پیگیری را وارد کنید…" },
  { value: "fullName", label: "نام و نام خانوادگی", placeholder: "نام یا نام خانوادگی را وارد کنید…" },
  { value: "mobile", label: "تلفن", placeholder: "شماره تلفن را وارد کنید…" },
] as const;

export type LeadSearchField = (typeof leadSearchFields)[number]["value"];

export function leadSearchParams(query: string, searchField: LeadSearchField): Record<string, string> {
  const q = query.trim();
  return q.length >= 2 ? { q, searchField } : {};
}
