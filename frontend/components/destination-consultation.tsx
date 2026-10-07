"use client";
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
      setError(t("فیلدهای الزامی و هر دو رضایت را تکمیل کنید.", "Complete the required fields and both consent options.")); setStatus("error"); return;
    }
    const mobile = normalizeMobile(String(form.get("mobile") ?? ""));
    if (!mobile) { setError(t("لطفاً شماره موبایل معتبر وارد کنید.", "Please enter a valid mobile number.")); setStatus("error"); return; }
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
      setError(cause instanceof ApiError ? cause.message : t("ثبت درخواست انجام نشد. لطفاً دوباره تلاش کنید.", "Could not submit your request. Please try again."));
      setStatus("error");
    } finally { sending.current = false; }
  }
  if (status === "success") return <div className={styles.card} role="status" dir={locale === "fa" ? "rtl" : "ltr"}><h3>{t("درخواست شما ثبت شد", "Your request has been received")}</h3><p>{t("تیم جهان آکادمی برای هماهنگی مشاوره با شما تماس می‌گیرد.", "Jahan Academy will contact you to arrange your consultation.")}</p><strong>{t("کد پیگیری: ", "Reference: ")}{reference}</strong></div>;
  return <form data-destination-motion="side" data-destination-delay="60" className={styles.card} onSubmit={submit} dir={locale === "fa" ? "rtl" : "ltr"} aria-label={t("درخواست مشاوره تخصصی رایگان", "Request a free consultation")}>
    <ConsultationFormHeading locale={locale} />
    <div className={styles.fields}>
      <label htmlFor={id + "-first"}>{t("نام *", "First name *")}<input id={id + "-first"} name="firstName" required maxLength={100} autoComplete="given-name" /></label>
      <label htmlFor={id + "-last"}>{t("نام خانوادگی *", "Last name *")}<input id={id + "-last"} name="lastName" required maxLength={100} autoComplete="family-name" /></label>
      <label htmlFor={id + "-mobile"}>{t("شماره موبایل *", "Mobile number *")}<input id={id + "-mobile"} name="mobile" type="tel" required maxLength={30} autoComplete="tel" placeholder="0912 000 0000" dir="ltr" /></label>
      <label htmlFor={id + "-occupation"}>{t("حوزه فعالیت *", "Occupation *")}<select id={id + "-occupation"} name="occupation" required defaultValue=""><option value="" disabled>{t("حوزه فعالیت خود را انتخاب کنید", "Select your occupation")}</option>{[["دانش‌آموز", "School student"], ["دانشجو", "University student"], ["شاغل", "Employed"], ["سایر", "Other"]].map(([fa, en]) => <option key={en} value={t(fa, en)}>{t(fa, en)}</option>)}</select></label>
      <label className={styles.wide} htmlFor={id + "-time"}>{t("زمان مناسب تماس (اختیاری)", "Preferred contact time (optional)")}<select id={id + "-time"} name="contactTime">{[["فرقی ندارد", "Any time"], ["صبح", "Morning"], ["بعدازظهر", "Afternoon"], ["عصر", "Evening"]].map(([fa, en]) => <option key={en} value={t(fa, en)}>{t(fa, en)}</option>)}</select></label>
    </div>
    <label className={styles.consent}><input type="checkbox" name="privacyConsent" required /><span>{t("با ثبت اطلاعاتم طبق ", "I agree to the processing of my information under the ")}<Link href={`/${locale}/privacy`}>{t("سیاست حریم خصوصی", "privacy policy")}</Link>{t(" موافقم.", ".")}</span></label>
    <label className={styles.consent}><input type="checkbox" name="contactConsent" required /><span>{t("با تماس تیم جهان آکادمی برای این درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}</span></label>
    {status === "error" && <p role="alert">{error}</p>}
    <button type="submit" className={styles.submit} disabled={status === "sending"} aria-busy={status === "sending"}>{status === "sending" ? t("در حال ثبت…", "Submitting…") : t("ثبت درخواست مشاوره", "Submit consultation request")}</button>
  </form>;
}
