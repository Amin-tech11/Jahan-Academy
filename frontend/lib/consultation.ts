import type { Locale } from "./site-content";

export type ConsultationFields = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  country: string;
  intake: string;
  startYear: string;
  age: string;
  gender: string;
  occupation: string;
  maritalStatus: string;
  budgetRange: string;
  currency: string;
  message: string;
  privacyConsent: boolean;
  contactConsent: boolean;
};

export type ConsultationFieldName = keyof ConsultationFields;
export type ConsultationErrors = Partial<Record<ConsultationFieldName, string>>;

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const intakeTerms = new Set(["spring", "summer", "fall", "winter", "unknown"]);
const genderCodes = new Set(["female", "male", "non_binary", "prefer_not_to_say"]);
const maritalCodes = new Set(["single", "married", "divorced", "widowed", "prefer_not_to_say"]);
const budgetCodes = new Set(["under_10k", "10k_20k", "20k_40k", "40k_plus", "prefer_not_to_say"]);

export function latinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : arabicDigits.indexOf(digit));
  });
}

export function normalizeMobile(value: string): string | null {
  let mobile = latinDigits(value).trim();
  if (/[a-z]/i.test(mobile)) return null;
  mobile = mobile.replace(/[\s().-]/g, "");
  if (mobile.startsWith("00")) mobile = `+${mobile.slice(2)}`;
  if (mobile.startsWith("+980")) mobile = `+98${mobile.slice(4)}`;
  if (/^09\d{9}$/.test(mobile)) mobile = `+98${mobile.slice(1)}`;
  if (/^9\d{9}$/.test(mobile)) mobile = `+98${mobile}`;
  if (mobile.startsWith("+98") && !/^\+989\d{9}$/.test(mobile)) return null;
  return /^\+[1-9]\d{7,14}$/.test(mobile) ? mobile : null;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [local, domain] = email.split("@");
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (/[<>()[\]\\,;:"]/.test(local)) return false;
  return domain.split(".").every((label) =>
    label.length <= 63 && /^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(label));
}

export function sourcePageUrl(locale: Locale, source?: string): string {
  const home = `/${locale}`;
  if (!source) return `/${locale}/consultation`;
  if (source.startsWith("home")) return home;
  const simple: Record<string, string> = {
    contact: "contact", countries: "countries", universities: "universities",
    services: "services", article: "articles", news: "news", faq: "faq", about: "about",
  };
  if (simple[source]) return `${home}/${simple[source]}`;
  const match = /^(university|country|service|article|news):([a-z0-9-]+)(?::footer)?$/.exec(source);
  const folders: Record<string, string> = {
    university: "universities", country: "countries", service: "services",
    article: "articles", news: "news",
  };
  return match ? `${home}/${folders[match[1]]}/${match[2]}` : `/${locale}/consultation`;
}

export function validateConsultation(fields: ConsultationFields, locale: Locale, year = new Date().getUTCFullYear()) {
  const fa = locale === "fa";
  const errors: ConsultationErrors = {};
  const required = fa ? "تکمیل این فیلد الزامی است." : "This field is required.";
  if (!fields.firstName.trim() || fields.firstName.trim().length > 100) errors.firstName = required;
  if (!fields.lastName.trim() || fields.lastName.trim().length > 100) errors.lastName = required;
  const mobile = normalizeMobile(fields.mobile);
  if (!mobile) errors.mobile = fa ? "شماره موبایل ایران یا بین‌المللی معتبر وارد کنید." : "Enter a valid Iranian or international mobile number.";
  if (fields.email.trim() && !isValidEmail(fields.email)) errors.email = fa ? "ایمیل معتبر وارد کنید؛ مانند name@example.com." : "Enter a valid email address, e.g. name@example.com.";
  if (!fields.country.trim() || fields.country.trim().length > 100) errors.country = required;
  if (!intakeTerms.has(fields.intake)) errors.intake = required;
  const startYear = Number(latinDigits(fields.startYear));
  if (!Number.isInteger(startYear) || startYear < year || startYear > year + 10) errors.startYear = fa ? "سال شروع معتبر انتخاب کنید." : "Choose a valid start year.";
  if (fields.age.trim()) {
    const age = Number(latinDigits(fields.age));
    if (!Number.isInteger(age) || age < 18 || age > 100) errors.age = fa ? "سن باید بین ۱۸ تا ۱۰۰ باشد." : "Age must be between 18 and 100.";
  }
  if (fields.gender && !genderCodes.has(fields.gender)) errors.gender = required;
  if (fields.occupation.trim().length > 120) errors.occupation = fa ? "عنوان شغلی طولانی است." : "Occupation is too long.";
  if (fields.maritalStatus && !maritalCodes.has(fields.maritalStatus)) errors.maritalStatus = required;
  if (fields.budgetRange && !budgetCodes.has(fields.budgetRange)) errors.budgetRange = required;
  if (fields.budgetRange && fields.budgetRange !== "prefer_not_to_say" && !/^[A-Z]{3}$/.test(fields.currency)) errors.currency = required;
  if (fields.message.length > 2000) errors.message = fa ? "پیام نباید بیش از ۲۰۰۰ نویسه باشد." : "The message must be 2,000 characters or fewer.";
  if (!fields.privacyConsent) errors.privacyConsent = required;
  if (!fields.contactConsent) errors.contactConsent = required;
  return { errors, mobile };
}

export function consultationPayload(fields: ConsultationFields, locale: Locale, pageUrl: string, mobile: string) {
  const optional = (value: string) => value.trim() || null;
  return {
    firstName: fields.firstName.trim(), lastName: fields.lastName.trim(), mobile,
    email: optional(fields.email), desiredCountryText: fields.country.trim(),
    intakeTerm: fields.intake, startYear: Number(latinDigits(fields.startYear)),
    age: fields.age.trim() ? Number(latinDigits(fields.age)) : null,
    gender: fields.gender || null, occupation: optional(fields.occupation),
    maritalStatus: fields.maritalStatus || null,
    investmentBudget: fields.budgetRange && fields.budgetRange !== "prefer_not_to_say"
      ? { rangeCode: fields.budgetRange, currency: fields.currency } : null,
    message: optional(fields.message), locale, source: { pageUrl },
    privacyConsent: fields.privacyConsent, contactConsent: fields.contactConsent, website: "",
  };
}
