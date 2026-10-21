"use client";
import { contactTimes } from "@/lib/contact-times";
import SiteSelect from "./site-select";
import { usePublicFormFeedback } from "./use-public-form-feedback";
import { createRequestKey } from "@/lib/request-key";

import Link from "next/link";
import { ConsultationSuccess } from "./consultation-success";
import { ConsultationFormHeading } from "./consultation-form-heading";
import { type FormEvent, useId, useRef, useState } from "react";
import { ApiError, apiRequest, type ApiEnvelope } from "@/lib/api-client";
import { normalizeMobile } from "@/lib/consultation";
import type { Locale } from "@/lib/site-content";

type Receipt = { reference: string; duplicate: boolean };

export function ServicesConsultationForm({ locale }: { locale: Locale }) {
  const id = useId();
  const feedback = usePublicFormFeedback(locale);
  const fa = locale === "fa";
  const t = (persian: string, english: string) => fa ? persian : english;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const request = useRef<{ serialized: string; key: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const mobile = normalizeMobile(value("mobile"));
    const phone = form.elements.namedItem("mobile") as HTMLInputElement;
    phone.setCustomValidity(mobile ? "" : t("شماره موبایل معتبر وارد کنید؛ مانند ۰۹۱۲… یا ‎+49…", "Enter a valid mobile number, such as 0912… or +49…"));
    if (!form.reportValidity() || !mobile) return;
    const payload = {
      firstName: value("firstName"), lastName: value("lastName"), mobile,
      desiredCountryText: t("هنوز انتخاب نشده؛ بررسی در مشاوره", "Undecided; discuss during consultation"),
      intakeTerm: "unknown", startYear: new Date().getUTCFullYear(),
      occupation: value("occupation"), locale, source: { pageUrl: `/${locale}/services` },
      privacyConsent: data.get("privacyConsent") === "on",
      contactConsent: data.get("contactConsent") === "on", website: value("website"),
      message: value("contactTime") ? `${t("زمان ترجیحی تماس", "Preferred contact time")}: ${value("contactTime")}` : null,
    };
    const serialized = JSON.stringify(payload);
    if (request.current?.serialized !== serialized) request.current = { serialized, key: createRequestKey() };
    setBusy(true); setError("");
    try {
      const response = await apiRequest<ApiEnvelope<Receipt>>("/consultation-requests", {
        method: "POST", headers: { "Idempotency-Key": request.current.key }, body: payload,
      });
      if (!response.data?.reference) throw new Error("Missing receipt");
      setReceipt(response.data);
    } catch (cause) {
      if (cause instanceof ApiError) feedback.serverErrors(cause.fieldErrors);
      setError(cause instanceof ApiError ? cause.message : t("تأیید ثبت درخواست دریافت نشد. لطفاً دوباره تلاش کنید.", "We could not confirm your submission. Please try again."));
    } finally { setBusy(false); }
  }

  if (receipt) return <ConsultationSuccess locale={locale} reference={receipt.reference} duplicate={receipt.duplicate} />;

  return <form {...feedback.formProps} className="services-request" onSubmit={submit} aria-label={t("درخواست مشاوره تخصصی رایگان", "Request a free expert consultation")}>
    <ConsultationFormHeading locale={locale} />
    <div className="services-request__fields">
      <label htmlFor={`${id}-first`}>{t("نام", "First name")} *<input id={`${id}-first`} {...feedback.fieldProps("firstName")} name="firstName" autoComplete="given-name" required maxLength={100} />{feedback.message("firstName")}</label>
      <label htmlFor={`${id}-last`}>{t("نام خانوادگی", "Last name")} *<input id={`${id}-last`} {...feedback.fieldProps("lastName")} name="lastName" autoComplete="family-name" required maxLength={100} />{feedback.message("lastName")}</label>
      <label htmlFor={`${id}-phone`}>{t("شماره موبایل", "Mobile number")} *<input id={`${id}-phone`} {...feedback.fieldProps("mobile")} name="mobile" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="0912 000 0000" required maxLength={32} onInput={(event) => event.currentTarget.setCustomValidity("")} />{feedback.message("mobile")}</label>
      <label htmlFor={`${id}-occupation`}>{t("حوزه فعالیت", "Field of activity")} *<SiteSelect id={`${id}-occupation`} {...feedback.fieldProps("occupation")} name="occupation" defaultValue="" required><option value="" disabled>{t("حوزه فعالیت خود را انتخاب کنید", "Select your field of activity")}</option>{[ ["مهندسی", "Engineering"], ["علوم پایه", "Natural sciences"], ["پزشکی", "Medicine"], ["پیراپزشکی", "Allied health"], ["علوم انسانی", "Humanities"], ["مدیریت و کسب‌وکار", "Business and management"], ["هنر و معماری", "Art and architecture"], ["سایر", "Other"] ].map(([persian, english]) => <option key={english} value={t(persian, english)}>{t(persian, english)}</option>)}</SiteSelect>{feedback.message("occupation")}</label>
      <label className="services-request__wide" htmlFor={`${id}-time`}>{t("زمان مناسب تماس (اختیاری)", "Preferred contact time (optional)")}<SiteSelect id={`${id}-time`} {...feedback.fieldProps("contactTime")} name="contactTime" style={{ direction: "ltr" }} defaultValue=""><option value="">{t("فرقی ندارد", "No preference")}</option>{contactTimes.map((time) => <option key={time} value={time}>{time}</option>)}</SiteSelect>{feedback.message("contactTime")}</label>
    </div>
    <div className="services-request__trap" aria-hidden="true"><label>Website<input {...feedback.fieldProps("website")} name="website" tabIndex={-1} autoComplete="off" />{feedback.message("website")}</label></div>
    <label className="services-request__consent"><input type="checkbox" {...feedback.fieldProps("privacyConsent")} name="privacyConsent" required /><span>{t("با ثبت اطلاعاتم طبق", "I agree to submit my information under the")} <Link href={`/${locale}/privacy`}>{t("سیاست حریم خصوصی", "privacy policy")}</Link> {t("موافقم.", ".")}{feedback.message("privacyConsent")}</span></label>
    <label className="services-request__consent"><input type="checkbox" {...feedback.fieldProps("contactConsent")} name="contactConsent" required /><span>{t("با تماس تیم جهان آکادمی برای این درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}{feedback.message("contactConsent")}</span></label>
    {error && <p className="services-request__error" role="alert">{error}</p>}
    <button type="submit" disabled={!feedback.ready || busy} aria-busy={busy}>{busy ? t("در حال ارسال…", "Sending…") : t("ثبت درخواست مشاوره", "Request a consultation")}</button>
  </form>;
}
