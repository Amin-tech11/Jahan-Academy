"use client";
import { contactTimes } from "@/lib/contact-times";
import SiteSelect from "./site-select";
import { usePublicFormFeedback } from "./use-public-form-feedback";
import { createRequestKey } from "@/lib/request-key";

import Link from "next/link";
import styles from "./destination-consultation.module.css";
import { ConsultationFormHeading } from "./consultation-form-heading";
import type { Destination } from "@/lib/destination-content";
import { useId, useRef, useState, type FormEvent } from "react";
import { apiRequest, ApiError, type ApiEnvelope } from "@/lib/api-client";
import { normalizeMobile } from "@/lib/consultation";
import type { Locale } from "@/lib/site-content";

export function DestinationConsultation({ locale, destination }: { locale: Locale; destination: Destination }) {
  const id = useId();
  const feedback = usePublicFormFeedback(locale);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const sending = useRef(false);
  const request = useRef<{ serialized: string; key: string } | null>(null);
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = new FormData(event.currentTarget);
    if (!event.currentTarget.reportValidity()) return;
    if (!String(form.get("firstName") ?? "").trim() || !String(form.get("lastName") ?? "").trim() || !form.get("occupation") || form.get("privacyConsent") !== "on" || form.get("contactConsent") !== "on") {
      const missing = ["firstName", "lastName"].find(name => !String(form.get(name) ?? "").trim())
        ?? (!form.get("occupation") ? "occupation" : form.get("privacyConsent") !== "on" ? "privacyConsent" : "contactConsent");
      feedback.mark(missing, t("فیلدهای الزامی و هر دو رضایت را تکمیل کنید.", "Complete the required fields and both consent options."));
      setError(t("فیلدهای الزامی و هر دو رضایت را تکمیل کنید.", "Complete the required fields and both consent options.")); setStatus("error"); return;
    }
    const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
    if (!mobile) { feedback.mark("mobile", t("لطفاً شماره موبایل معتبر وارد کنید.", "Please enter a valid mobile number.")); setError(t("لطفاً شماره موبایل معتبر وارد کنید.", "Please enter a valid mobile number.")); setStatus("error"); return; }
    const payload = {
      firstName: String(form.get("firstName")).trim(), lastName: String(form.get("lastName")).trim(),
      mobile, occupation: String(form.get("occupation")), desiredCountryText: destination.name[locale],
      intakeTerm: "unknown", startYear: new Date().getUTCFullYear(),
      message: t("زمان مناسب تماس: ", "Preferred contact time: ") + String(form.get("contactTime")),
      locale, source: { pageUrl: `/${locale}/countries/${destination.slug}#destination-consultation` },
      privacyConsent: form.get("privacyConsent") === "on", contactConsent: form.get("contactConsent") === "on", website: "",
    };
    const serialized = JSON.stringify(payload);
    if (request.current?.serialized !== serialized) request.current = { serialized, key: createRequestKey() };
    sending.current = true;
    setStatus("sending"); setError("");
    try {
      const response = await apiRequest<ApiEnvelope<{ reference: string }>>("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": request.current.key }, body: payload });
      setReference(response.data.reference); setStatus("success");
    } catch (cause) {
      if (cause instanceof ApiError) feedback.serverErrors(cause.fieldErrors);
      setError(cause instanceof ApiError ? cause.message : t("ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.", "Could not submit your request. Please try again."));
      setStatus("error");
    } finally { sending.current = false; }
  }
  if (status === "success") return <div className={styles.card} role="status" dir={locale === "fa" ? "rtl" : "ltr"}><h3>{t("درخواست شما ثبت شد", "Your request has been received")}</h3><p>{t("تیم جهان آکادمی برای هماهنگی مشاوره با شما تماس می‌گیرد.", "Jahan Academy will contact you to arrange your consultation.")}</p><strong>{t("کد پیگیری: ", "Reference: ")}{reference}</strong></div>;
  return <form {...feedback.formProps} data-consultation-form data-destination-motion="side" data-destination-delay="60" className={styles.card} onSubmit={submit} dir={locale === "fa" ? "rtl" : "ltr"} aria-label={t("درخواست مشاوره تخصصی رایگان", "Request a free consultation")}>
    <ConsultationFormHeading locale={locale} />
    <div className={styles.fields}>
      <label htmlFor={id + "-first"}>{t("نام *", "First name *")}<input id={id + "-first"} {...feedback.fieldProps("firstName")} name="firstName" required maxLength={100} autoComplete="given-name" />{feedback.message("firstName")}</label>
      <label htmlFor={id + "-last"}>{t("نام خانوادگی *", "Last name *")}<input id={id + "-last"} {...feedback.fieldProps("lastName")} name="lastName" required maxLength={100} autoComplete="family-name" />{feedback.message("lastName")}</label>
      <label htmlFor={id + "-mobile"}>{t("شماره موبایل *", "Mobile number *")}<input id={id + "-mobile"} {...feedback.fieldProps("mobile")} name="mobile" type="tel" required maxLength={30} autoComplete="tel" placeholder="0912 000 0000" dir="ltr" />{feedback.message("mobile")}</label>
      <label htmlFor={id + "-occupation"}>{t("حوزه فعالیت *", "Occupation *")}<SiteSelect id={id + "-occupation"} {...feedback.fieldProps("occupation")} name="occupation" required defaultValue=""><option value="" disabled>{t("حوزه فعالیت خود را انتخاب کنید", "Select your occupation")}</option>{[["دانش‌آموز", "School student"], ["دانشجو", "University student"], ["شاغل", "Employed"], ["سایر", "Other"]].map(([fa, en]) => <option key={en} value={t(fa, en)}>{t(fa, en)}</option>)}</SiteSelect>{feedback.message("occupation")}</label>
      <label className={styles.wide} htmlFor={id + "-time"}>{t("زمان مناسب تماس (اختیاری)", "Preferred contact time (optional)")}<SiteSelect id={id + "-time"} {...feedback.fieldProps("contactTime")} name="contactTime" style={{ direction: locale === "fa" ? "rtl" : "ltr" }}><option value={t("فرقی ندارد", "Any time")}>{t("فرقی ندارد", "Any time")}</option>{contactTimes.map(time => <option key={time} value={time}>{time}</option>)}</SiteSelect>{feedback.message("contactTime")}</label>
    </div>
    <label className={styles.consent}><input type="checkbox" {...feedback.fieldProps("privacyConsent")} name="privacyConsent" required /><span>{t("با ثبت اطلاعاتم طبق ", "I agree to the processing of my information under the ")}<Link href={`/${locale}/privacy`}>{t("سیاست حریم خصوصی", "privacy policy")}</Link>{t(" موافقم.", ".")}{feedback.message("privacyConsent")}</span></label>
    <label className={styles.consent}><input type="checkbox" {...feedback.fieldProps("contactConsent")} name="contactConsent" required /><span>{t("با تماس تیم جهان آکادمی برای این درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}{feedback.message("contactConsent")}</span></label>
    {status === "error" && <p role="alert">{error}</p>}
    <button type="submit" className={styles.submit} disabled={!feedback.ready || status === "sending"} aria-busy={status === "sending"}>{status === "sending" ? t("در حال ثبت…", "Submitting…") : t("ثبت درخواست مشاوره", "Submit consultation request")}</button>
  </form>;
}
