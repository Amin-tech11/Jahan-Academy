"use client";
import SiteSelect from "./site-select";
import { createRequestKey } from "@/lib/request-key";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type ApiEnvelope } from "@/lib/api-client";
import { normalizeMobile } from "@/lib/consultation";
import type { Locale } from "@/lib/site-content";
import { ConsultationFormHeading } from "./consultation-form-heading";

export function DestinationsConsultation({ locale }: { locale: Locale }) {
  const id = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const request = useRef<{ serialized: string; key: string } | null>(null);
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
    if (!mobile) { setError(t("لطفاً شماره موبایل معتبر وارد کنید.", "Please enter a valid mobile number.")); setStatus("error"); return; }
    const payload = {
      firstName: String(form.get("firstName")).trim(), lastName: String(form.get("lastName")).trim(),
      mobile, occupation: String(form.get("occupation")), desiredCountryText: t("هنوز انتخاب نشده؛ بررسی در مشاوره", "Undecided; discuss during consultation"),
      intakeTerm: "unknown", startYear: new Date().getUTCFullYear(),
      message: t("زمان مناسب تماس: ", "Preferred contact time: ") + String(form.get("contactTime")),
      locale, source: { pageUrl: `/${locale}/countries#destination-consultation` },
      privacyConsent: form.get("privacyConsent") === "on", contactConsent: form.get("contactConsent") === "on", website: "",
    };
    const serialized = JSON.stringify(payload);
    if (request.current?.serialized !== serialized) request.current = { serialized, key: createRequestKey() };
    setStatus("sending"); setError("");
    try {
      const response = await apiRequest<ApiEnvelope<{ reference: string }>>("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": request.current.key }, body: payload });
      setReference(response.data.reference); setStatus("success");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t("ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.", "Could not submit your request. Please try again."));
      setStatus("error");
    }
  }
  if (status === "success") return <div className="home-closing__card" role="status"><h3>{t("درخواست شما ثبت شد", "Your request has been received")}</h3><p>{t("تیم جهان آکادمی برای هماهنگی مشاوره با شما تماس می‌گیرد.", "Jahan Academy will contact you to arrange your consultation.")}</p><strong>{t("کد پیگیری: ", "Reference: ")}{reference}</strong></div>;
  return <form className="home-closing__card home-consultation__form" onSubmit={submit} aria-label={t("درخواست مشاوره تخصصی رایگان", "Request a free consultation")}>
    <ConsultationFormHeading locale={locale} />
    <div className="home-consultation__fields">
      <label htmlFor={id + "-first"}>{t("نام *", "First name *")}<input id={id + "-first"} name="firstName" required maxLength={100} autoComplete="given-name" /></label>
      <label htmlFor={id + "-last"}>{t("نام خانوادگی *", "Last name *")}<input id={id + "-last"} name="lastName" required maxLength={100} autoComplete="family-name" /></label>
      <label htmlFor={id + "-mobile"}>{t("شماره موبایل *", "Mobile number *")}<input id={id + "-mobile"} name="mobile" type="tel" required maxLength={30} autoComplete="tel" placeholder="0912 000 0000" dir="ltr" /></label>
      <label htmlFor={id + "-occupation"}>{t("حوزه فعالیت *", "Occupation *")}<SiteSelect id={id + "-occupation"} name="occupation" required defaultValue=""><option value="" disabled>{t("حوزه فعالیت خود را انتخاب کنید", "Select your occupation")}</option>{[["دانش‌آموز", "School student"], ["دانشجو", "University student"], ["شاغل", "Employed"], ["سایر", "Other"]].map(([fa, en]) => <option key={en} value={t(fa, en)}>{t(fa, en)}</option>)}</SiteSelect></label>
      <label className="home-consultation__wide" htmlFor={id + "-time"}>{t("زمان مناسب تماس (اختیاری)", "Preferred contact time (optional)")}<SiteSelect id={id + "-time"} name="contactTime">{[["فرقی ندارد", "Any time"], ["صبح", "Morning"], ["بعدازظهر", "Afternoon"], ["عصر", "Evening"]].map(([fa, en]) => <option key={en} value={t(fa, en)}>{t(fa, en)}</option>)}</SiteSelect></label>
    </div>
    <label className="home-consultation__consent"><input type="checkbox" name="privacyConsent" required /><span>{t("با ثبت اطلاعاتم طبق ", "I agree to the processing of my information under the ")}<Link href={`/${locale}/privacy`}>{t("سیاست حریم خصوصی", "privacy policy")}</Link>{t(" موافقم.", ".")}</span></label>
    <label className="home-consultation__consent"><input type="checkbox" name="contactConsent" required /><span>{t("با تماس تیم جهان آکادمی برای این درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}</span></label>
    {status === "error" && <p role="alert">{error}</p>}
    <button type="submit" className="ui-button ui-button--primary" disabled={status === "sending"} aria-busy={status === "sending"}>{status === "sending" ? t("در حال ثبت…", "Submitting…") : t("ثبت درخواست مشاوره", "Submit consultation request")}</button>
  </form>;
}
