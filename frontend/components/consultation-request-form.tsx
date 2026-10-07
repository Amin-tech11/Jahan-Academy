"use client";

import Link from "next/link";
import { ConsultationSuccess } from "./consultation-success";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Alert, Button, FormField, Input, Select, Textarea } from "@/components/ui";
import { ApiError, apiRequest, type ApiEnvelope } from "@/lib/api-client";
import {
  consultationPayload, type ConsultationErrors, type ConsultationFields,
  type ConsultationFieldName, sourcePageUrl, validateConsultation,
} from "@/lib/consultation";
import { type Locale, siteCopy } from "@/lib/site-content";

type CurrencyOption = { code: string; name: string };
type Receipt = { reference: string; duplicate: boolean; receivedAt?: string };
type Status = "idle" | "submitting" | "success" | "error";

const backendFields: Record<string, ConsultationFieldName> = {
  firstName: "firstName", lastName: "lastName", mobile: "mobile", email: "email",
  desiredCountryText: "country", intakeTerm: "intake", startYear: "startYear",
  age: "age", gender: "gender", occupation: "occupation",
  maritalStatus: "maritalStatus", "investmentBudget.rangeCode": "budgetRange",
  "investmentBudget.currency": "currency", message: "message",
  privacyConsent: "privacyConsent", contactConsent: "contactConsent",
};

const choose = (locale: Locale, fa: string, en: string) => locale === "fa" ? fa : en;
const initialFields = (): ConsultationFields => ({
  firstName: "", lastName: "", mobile: "", email: "", country: "", intake: "unknown",
  startYear: String(new Date().getUTCFullYear()), age: "", gender: "", occupation: "",
  maritalStatus: "", budgetRange: "", currency: "", message: "",
  privacyConsent: false, contactConsent: false,
});

export function ConsultationForm({ locale, source }: {
  locale: Locale;
  source: string;
}) {
  const copy = siteCopy[locale];
  const [fields, setFields] = useState<ConsultationFields>(initialFields);
  const [errors, setErrors] = useState<ConsultationErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const requestKey = useRef<{ payload: string; key: string } | null>(null);
  const year = new Date().getUTCFullYear();
  const pageUrl = source.startsWith(`/${locale}/`) ? source : sourcePageUrl(locale, source);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ApiEnvelope<CurrencyOption[]>>("/reference-data/currencies", {
      query: { locale, limit: 100 }, signal: controller.signal,
    }).then((response) => setCurrencies(response.data)).catch(() => setCurrencies([])).finally(() => setCurrencyLoading(false));
    return () => controller.abort();
  }, [locale]);

  function setField<K extends ConsultationFieldName>(name: K, value: ConsultationFields[K]) {
    setFields((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    if (status === "error") setStatus("idle");
  }

  function fieldProps(name: ConsultationFieldName) {
    return {
      id: `consultation-${name}`,
      "aria-invalid": Boolean(errors[name]) || undefined,
      "aria-describedby": errors[name] ? `consultation-${name}-error` : undefined,
    } as const;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const result = validateConsultation(fields, locale, year);
    setErrors(result.errors);
    if (Object.keys(result.errors).length || !result.mobile) {
      const first = Object.keys(result.errors)[0];
      document.getElementById(`consultation-${first}`)?.focus();
      return;
    }
    setStatus("submitting");
    setMessage("");
    const payload = consultationPayload(fields, locale, pageUrl, result.mobile);
    const serialized = JSON.stringify(payload);
    if (requestKey.current?.payload !== serialized) requestKey.current = { payload: serialized, key: crypto.randomUUID() };
    try {
      const response = await apiRequest<ApiEnvelope<Receipt>>("/consultation-requests", {
        method: "POST", headers: { "Idempotency-Key": requestKey.current.key }, body: payload,
      });
      setReceipt(response.data);
      setStatus("success");
    } catch (error) {
      if (error instanceof ApiError) {
        const serverErrors: ConsultationErrors = {};
        Object.keys(error.fieldErrors ?? {}).forEach((key) => {
          const field = backendFields[key];
          if (field) serverErrors[field] = choose(locale, "مقدار واردشده معتبر نیست.", "Please check this value.");
        });
        setErrors(serverErrors);
        setMessage(error.status === 429
          ? choose(locale, "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", "Too many attempts. Please try again later.")
          : choose(locale, "ثبت درخواست انجام نشد. موارد مشخص‌شده را بررسی و دوباره تلاش کنید.", "We could not submit your request. Check the highlighted fields and try again."));
      } else {
        setMessage(copy.formError);
      }
      setStatus("error");
    }
  }

  if (status === "success" && receipt) return <div className="consultation-request-form"><ConsultationSuccess locale={locale} reference={receipt.reference} duplicate={receipt.duplicate} /></div>;

  return <form className="consultation-request-form" onSubmit={submit} noValidate aria-label={copy.consultationTitle}>
    <p className="consultation-request-form__intro">{choose(locale, "فیلدهای ستاره‌دار الزامی‌اند. اطلاعات شما فقط برای بررسی درخواست مشاوره استفاده می‌شود.", "Fields marked * are required. Your information is used to review your consultation request.")}</p>
    {pageUrl !== `/${locale}/consultation` && <p className="consultation-request-form__source">{choose(locale, "مبدأ درخواست:", "Request from:")} <span dir="ltr">{pageUrl}</span></p>}
    <div className="consultation-request-form__grid">
      <FormField {...fieldProps("firstName")} label={choose(locale, "نام", "First name")} required error={errors.firstName}><Input {...fieldProps("firstName")} value={fields.firstName} onChange={(event) => setField("firstName", event.target.value)} autoComplete="given-name" maxLength={100} required /></FormField>
      <FormField {...fieldProps("lastName")} label={choose(locale, "نام خانوادگی", "Last name")} required error={errors.lastName}><Input {...fieldProps("lastName")} value={fields.lastName} onChange={(event) => setField("lastName", event.target.value)} autoComplete="family-name" maxLength={100} required /></FormField>
      <FormField {...fieldProps("mobile")} label={choose(locale, "شماره موبایل", "Mobile number")} required error={errors.mobile} hint={choose(locale, "شماره ایران یا بین‌المللی، مانند ۰۹۱۲… یا ‎+49…", "Iranian or international number, e.g. 0912… or +49…")}><Input {...fieldProps("mobile")} value={fields.mobile} onChange={(event) => setField("mobile", event.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" maxLength={32} required /></FormField>
      <FormField {...fieldProps("email")} label={choose(locale, "ایمیل (اختیاری)", "Email (optional)")} error={errors.email}><Input {...fieldProps("email")} value={fields.email} onChange={(event) => setField("email", event.target.value)} type="email" autoComplete="email" dir="ltr" maxLength={254} /></FormField>
      <FormField {...fieldProps("country")} label={choose(locale, "کشور مقصد مورد نظر", "Preferred study country")} required error={errors.country}><Input {...fieldProps("country")} value={fields.country} onChange={(event) => setField("country", event.target.value)} maxLength={100} required /></FormField>
      <FormField {...fieldProps("intake")} label={choose(locale, "زمان شروع تحصیل", "Preferred intake")} required error={errors.intake}><Select {...fieldProps("intake")} value={fields.intake} onChange={(event) => setField("intake", event.target.value)}><option value="unknown">{choose(locale, "هنوز مشخص نیست", "Undecided")}</option><option value="spring">{choose(locale, "بهار", "Spring")}</option><option value="summer">{choose(locale, "تابستان", "Summer")}</option><option value="fall">{choose(locale, "پاییز", "Fall")}</option><option value="winter">{choose(locale, "زمستان", "Winter")}</option></Select></FormField>
      <FormField {...fieldProps("startYear")} label={choose(locale, "سال شروع تحصیل", "Start year")} required error={errors.startYear}><Select {...fieldProps("startYear")} value={fields.startYear} onChange={(event) => setField("startYear", event.target.value)}>{Array.from({ length: 11 }, (_, index) => <option key={index} value={year + index}>{year + index}</option>)}</Select></FormField>
      <FormField {...fieldProps("age")} label={choose(locale, "سن (اختیاری)", "Age (optional)")} error={errors.age}><Input {...fieldProps("age")} value={fields.age} onChange={(event) => setField("age", event.target.value)} type="number" inputMode="numeric" min={18} max={100} /></FormField>
      <FormField {...fieldProps("gender")} label={choose(locale, "جنسیت (اختیاری)", "Gender (optional)")} error={errors.gender}><Select {...fieldProps("gender")} value={fields.gender} onChange={(event) => setField("gender", event.target.value)}><option value="">{choose(locale, "انتخاب کنید", "Select")}</option><option value="female">{choose(locale, "زن", "Female")}</option><option value="male">{choose(locale, "مرد", "Male")}</option><option value="non_binary">{choose(locale, "غیردودویی", "Non-binary")}</option><option value="prefer_not_to_say">{choose(locale, "تمایلی به پاسخ ندارم", "Prefer not to say")}</option></Select></FormField>
      <FormField {...fieldProps("occupation")} label={choose(locale, "شغل (اختیاری)", "Occupation (optional)")} error={errors.occupation}><Input {...fieldProps("occupation")} value={fields.occupation} onChange={(event) => setField("occupation", event.target.value)} maxLength={120} /></FormField>
      <FormField {...fieldProps("maritalStatus")} label={choose(locale, "وضعیت تأهل (اختیاری)", "Marital status (optional)")} error={errors.maritalStatus}><Select {...fieldProps("maritalStatus")} value={fields.maritalStatus} onChange={(event) => setField("maritalStatus", event.target.value)}><option value="">{choose(locale, "انتخاب کنید", "Select")}</option><option value="single">{choose(locale, "مجرد", "Single")}</option><option value="married">{choose(locale, "متأهل", "Married")}</option><option value="divorced">{choose(locale, "طلاق‌گرفته", "Divorced")}</option><option value="widowed">{choose(locale, "بیوه", "Widowed")}</option><option value="prefer_not_to_say">{choose(locale, "تمایلی به پاسخ ندارم", "Prefer not to say")}</option></Select></FormField>
      <FormField {...fieldProps("budgetRange")} label={choose(locale, "بازه بودجه سالانه (اختیاری)", "Annual budget range (optional)")} error={errors.budgetRange} hint={!currencyLoading && currencies.length === 0 ? choose(locale, "بازه بودجه پس از فعال‌شدن ارزها در دسترس است؛ این فیلد اختیاری است.", "Budget ranges will be available when currencies are configured; this field is optional.") : undefined}><Select {...fieldProps("budgetRange")} value={fields.budgetRange} onChange={(event) => setField("budgetRange", event.target.value)} disabled={currencyLoading || currencies.length === 0}><option value="">{choose(locale, "انتخاب کنید", "Select")}</option><option value="under_10k">{choose(locale, "کمتر از ۱۰٬۰۰۰", "Under 10,000")}</option><option value="10k_20k">{choose(locale, "۱۰٬۰۰۰ تا ۲۰٬۰۰۰", "10,000–20,000")}</option><option value="20k_40k">{choose(locale, "۲۰٬۰۰۰ تا ۴۰٬۰۰۰", "20,000–40,000")}</option><option value="40k_plus">{choose(locale, "بیش از ۴۰٬۰۰۰", "Over 40,000")}</option><option value="prefer_not_to_say">{choose(locale, "تمایلی به پاسخ ندارم", "Prefer not to say")}</option></Select></FormField>
      <FormField {...fieldProps("currency")} label={choose(locale, "واحد پول بودجه", "Budget currency")} required={Boolean(fields.budgetRange && fields.budgetRange !== "prefer_not_to_say")} error={errors.currency}><Select {...fieldProps("currency")} value={fields.currency} onChange={(event) => setField("currency", event.target.value)} disabled={!fields.budgetRange || fields.budgetRange === "prefer_not_to_say" || currencies.length === 0}><option value="">{choose(locale, "انتخاب کنید", "Select")}</option>{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>)}</Select></FormField>
    </div>
    <FormField {...fieldProps("message")} label={choose(locale, "توضیح یا سؤال شما (اختیاری)", "Your question (optional)")} error={errors.message}><Textarea {...fieldProps("message")} value={fields.message} onChange={(event) => setField("message", event.target.value)} rows={4} maxLength={2000} /></FormField>
    <div className="consultation-request-form__consents">
      <div><label className="consultation-consent"><input {...fieldProps("privacyConsent")} type="checkbox" checked={fields.privacyConsent} onChange={(event) => setField("privacyConsent", event.target.checked)} required /><span>{choose(locale, "سیاست حریم خصوصی و قوانین استفاده را خوانده‌ام و با ثبت اطلاعاتم موافقم.", "I have read the privacy policy and terms, and agree to submit my information.")}</span></label><p className="consultation-consent__links"><Link href={`/${locale}/privacy`}>{choose(locale, "حریم خصوصی", "Privacy")}</Link> · <Link href={`/${locale}/terms`}>{choose(locale, "قوانین استفاده", "Terms")}</Link></p>{errors.privacyConsent && <p id="consultation-privacyConsent-error" className="ui-field__error" role="alert">{errors.privacyConsent}</p>}</div>
      <div><label className="consultation-consent"><input {...fieldProps("contactConsent")} type="checkbox" checked={fields.contactConsent} onChange={(event) => setField("contactConsent", event.target.checked)} required /><span>{choose(locale, "با تماس تیم جهان آکادمی برای پیگیری این درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}</span></label>{errors.contactConsent && <p id="consultation-contactConsent-error" className="ui-field__error" role="alert">{errors.contactConsent}</p>}</div>
    </div>
    {status === "error" && <Alert tone="error">{message}</Alert>}
    <Button className="consultation-request-form__submit" size="lg" type="submit" disabled={status === "submitting"} aria-busy={status === "submitting"}>{status === "submitting" ? copy.sending : copy.submit}</Button>
  </form>;
}
