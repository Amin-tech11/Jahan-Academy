"use client";
import { createRequestKey } from "@/lib/request-key";

import { type FormEvent, type ReactNode, useId, useState } from "react";
import { ConsultationSuccess } from "./consultation-success";
import { ApiError, apiRequest, type ApiEnvelope } from "@/lib/api-client";
import { type Locale, siteCopy } from "@/lib/site-content";
import { isValidEmail, normalizeMobile } from "@/lib/consultation";

type FormStatus = "idle" | "submitting" | "success" | "error";

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return <label className="field" htmlFor={id}><span>{label}</span>{children}</label>;
}

export function ConsultationForm({ locale, source }: { locale: Locale; source: string }) {
  const copy = siteCopy[locale]; const id = useId(); const [status, setStatus] = useState<FormStatus>("idle");
  const [receipt, setReceipt] = useState<{ reference: string; duplicate: boolean } | null>(null); const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const mobile = normalizeMobile(String(form.get("mobile") || ""));
    const email = String(form.get("email") || "").trim();
    if (!mobile || (email && !isValidEmail(email))) {
      setMessage(locale === "fa" ? "شماره موبایل یا قالب ایمیل معتبر نیست." : "Enter a valid mobile number and email address.");
      setStatus("error"); return;
    }
    setStatus("submitting"); setMessage("");
    const payload = { firstName: form.get("firstName"), lastName: form.get("lastName"), mobile, email: email || null, desiredCountryText: form.get("country"), intakeTerm: form.get("intake"), startYear: Number(form.get("startYear")), age: form.get("age") ? Number(form.get("age")) : null, gender: form.get("gender") || null, occupation: form.get("occupation") || null, maritalStatus: form.get("maritalStatus") || null, message: form.get("message") || null, locale, source: { pageUrl: source }, privacyConsent: form.get("privacyConsent") === "on", contactConsent: form.get("contactConsent") === "on", website: "" };
    try { const body = await apiRequest<ApiEnvelope<{ reference: string; duplicate: boolean }>>("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": createRequestKey() }, body: payload }); setReceipt(body.data); setStatus("success"); } catch (error) { setMessage(error instanceof ApiError ? error.message : copy.formError); setStatus("error"); }
  }
  if (status === "success" && receipt) return <div className="consultation-form"><ConsultationSuccess locale={locale} reference={receipt.reference} duplicate={receipt.duplicate} /></div>;
  const year = new Date().getUTCFullYear(); const label = (fa: string, en: string) => locale === "fa" ? fa : en;
  return <form className="consultation-form" onSubmit={submit}><div className="form-grid">
    <Field id={`${id}-first`} label={label("نام", "First name")}><input id={`${id}-first`} name="firstName" required autoComplete="given-name" /></Field>
    <Field id={`${id}-last`} label={label("نام خانوادگی", "Last name")}><input id={`${id}-last`} name="lastName" required autoComplete="family-name" /></Field>
    <Field id={`${id}-mobile`} label={label("شماره موبایل", "Mobile number")}><input id={`${id}-mobile`} name="mobile" type="tel" required maxLength={32} inputMode="tel" autoComplete="tel" placeholder="+98 912 000 0000" /></Field>
    <Field id={`${id}-email`} label={label("ایمیل (اختیاری)", "Email (optional)")}><input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} /></Field>
    <Field id={`${id}-country`} label={label("مقصد مورد نظر", "Preferred destination")}><input id={`${id}-country`} name="country" required /></Field>
    <Field id={`${id}-intake`} label={label("زمان شروع", "Intake")}><select id={`${id}-intake`} name="intake" defaultValue="unknown"><option value="spring">{label("بهار", "Spring")}</option><option value="summer">{label("تابستان", "Summer")}</option><option value="fall">{label("پاییز", "Fall")}</option><option value="winter">{label("زمستان", "Winter")}</option><option value="unknown">{label("نامشخص", "Undecided")}</option></select></Field>
    <Field id={`${id}-year`} label={label("سال شروع", "Start year")}><select id={`${id}-year`} name="startYear" defaultValue={String(year)}>{Array.from({ length: 6 }, (_, index) => <option key={index} value={year + index}>{year + index}</option>)}</select></Field>
    <Field id={`${id}-age`} label={label("سن (اختیاری)", "Age (optional)")}><input id={`${id}-age`} name="age" type="number" min="18" max="100" /></Field>
    <Field id={`${id}-gender`} label={label("جنسیت (اختیاری)", "Gender (optional)")}><select id={`${id}-gender`} name="gender" defaultValue=""><option value="">—</option><option value="female">{label("زن", "Female")}</option><option value="male">{label("مرد", "Male")}</option></select></Field>
    <Field id={`${id}-occupation`} label={label("شغل (اختیاری)", "Occupation (optional)")}><input id={`${id}-occupation`} name="occupation" /></Field>
    <Field id={`${id}-marital`} label={label("وضعیت تأهل (اختیاری)", "Marital status (optional)")}><select id={`${id}-marital`} name="maritalStatus" defaultValue=""><option value="">—</option><option value="single">{label("مجرد", "Single")}</option><option value="married">{label("متأهل", "Married")}</option></select></Field>
  </div><Field id={`${id}-message`} label={label("پیام شما (اختیاری)", "Your message (optional)")}><textarea id={`${id}-message`} name="message" rows={4} /></Field><label className="consent"><input name="privacyConsent" type="checkbox" required /><span>{copy.privacyNotice}</span></label><label className="consent"><input name="contactConsent" type="checkbox" required /><span>{label("با تماس برای پیگیری درخواست موافقم.", "I agree to be contacted about this request.")}</span></label>{status === "error" && <p className="form-error" role="alert">{message || copy.formError}</p>}<button className="button button-primary form-submit" disabled={status === "submitting"} type="submit">{status === "submitting" ? copy.sending : copy.submit}</button></form>;
}
