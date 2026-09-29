"use client";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { ApiError, apiRequest, type ApiEnvelope } from "@/lib/api-client";
import { consultationPayload, normalizeMobile } from "@/lib/consultation";
import { type Locale, siteCopy } from "@/lib/site-content";

const t = (locale: Locale, fa: string, en: string) => locale === "fa" ? fa : en;
type Receipt = { reference: string; duplicate: boolean };

export function AssessmentForm({ locale, source }: { locale: Locale; source: string }) {
  const copy = siteCopy[locale];
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestKey = useRef<{ payload: string; key: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const form = new FormData(event.currentTarget);
    const names = String(form.get("fullName") || "").trim().split(/\s+/);
    const mobile = normalizeMobile(String(form.get("mobile") || ""));
    if (names.length < 2 || !mobile) {
      setError(t(locale, "نام و نام خانوادگی و شماره موبایل معتبر وارد کنید.", "Enter your full name and a valid mobile number."));
      setStatus("error"); return;
    }
    const detail = (key: string, fa: string, en: string) => form.get(key) ? t(locale, fa, en) + ": " + form.get(key) : "";
    const message = [
      detail("education", "تحصیلات", "Education"),
      detail("budget", "سرمایه مهاجرت", "Migration budget"),
      detail("language", "مهارت زبان انگلیسی", "English proficiency"),
      detail("service", "زمینه مورد نیاز", "Service interest"),
    ].filter(Boolean).join("\n");
    const fields = {
      firstName: names[0], lastName: names.slice(1).join(" "), mobile,
      email: String(form.get("email") || ""), country: t(locale, "نامشخص", "Undecided"),
      intake: "unknown", startYear: String(new Date().getUTCFullYear()),
      age: String(form.get("age") || ""), gender: String(form.get("gender") || ""),
      occupation: String(form.get("occupation") || ""), maritalStatus: String(form.get("maritalStatus") || ""),
      budgetRange: "", currency: "", message,
      privacyConsent: form.get("privacyConsent") === "on", contactConsent: form.get("contactConsent") === "on",
    };
    const payload = consultationPayload(fields, locale, source, mobile);
    const serialized = JSON.stringify(payload);
    if (requestKey.current?.payload !== serialized) requestKey.current = { payload: serialized, key: crypto.randomUUID() };
    setStatus("submitting"); setError("");
    try {
      const response = await apiRequest<ApiEnvelope<Receipt>>("/consultation-requests", { method: "POST", headers: { "Idempotency-Key": requestKey.current.key }, body: payload });
      setReceipt(response.data); setStatus("success");
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 429 ? t(locale, "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", "Too many attempts. Try again later.") : copy.formError);
      setStatus("error");
    }
  }
  if (status === "success" && receipt) return <section className="consultation-receipt" role="status" aria-live="polite">
    <span className="consultation-receipt__icon" aria-hidden="true">✓</span><h2>{copy.thankYou}</h2>
    <p>{receipt.duplicate ? copy.duplicate : copy.consultationText}</p>
    <div className="consultation-receipt__code"><span>{copy.trackingCode}</span><strong dir="ltr">{receipt.reference}</strong></div>
    <Link href={`/${locale}`}>{t(locale, "بازگشت به صفحه اصلی", "Back to home")}</Link>
  </section>;
  const options = (items: [string, string][]) => items.map(([fa, en]) => <option key={en} value={t(locale, fa, en)}>{t(locale, fa, en)}</option>);
  return <form className="assessment-form" onSubmit={submit} aria-label={t(locale, "فرم ارزیابی اولیه", "Initial assessment form")}>
    <div className="assessment-form__grid">
      <label>{t(locale, "نام و نام خانوادگی", "Full name")}<input name="fullName" autoComplete="name" required maxLength={200} /></label>
      <label>{t(locale, "شماره موبایل", "Mobile number")}<input name="mobile" type="tel" inputMode="tel" autoComplete="tel" required placeholder={t(locale, "مثال: ۰۹۱۲۱۲۳۴۵۶۷", "e.g. +989121234567")} /></label>
      <label>{t(locale, "ایمیل", "Email")}<input name="email" type="email" autoComplete="email" placeholder="example@email.com" /></label>
      <label>{t(locale, "سن", "Age")}<input name="age" type="number" inputMode="numeric" min="18" max="100" placeholder={t(locale, "مثال: ۲۵", "e.g. 25")} /></label>
      <label>{t(locale, "شغل", "Occupation")}<input name="occupation" maxLength={120} placeholder={t(locale, "مثال: دانشجو", "e.g. Student")} /></label>
      <label>{t(locale, "جنسیت", "Gender")}<select name="gender" defaultValue=""><option value="">{t(locale, "لطفاً جنسیت خود را انتخاب کنید", "Select your gender")}</option><option value="female">{t(locale, "زن", "Female")}</option><option value="male">{t(locale, "مرد", "Male")}</option></select></label>
      <label>{t(locale, "تحصیلات", "Education")}<select name="education" defaultValue=""><option value="">{t(locale, "انتخاب کنید", "Select")}</option>{options([["سیکل", "Middle school"], ["دیپلم", "High school diploma"], ["فوق دیپلم", "Associate degree"], ["لیسانس", "Bachelor's degree"], ["فوق لیسانس", "Master's degree"], ["دکتری و بالاتر", "Doctorate or higher"]])}</select></label>
      <label>{t(locale, "وضعیت تأهل", "Marital status")}<select name="maritalStatus" defaultValue=""><option value="">{t(locale, "انتخاب کنید", "Select")}</option><option value="single">{t(locale, "مجرد", "Single")}</option><option value="married">{t(locale, "متأهل", "Married")}</option></select></label>
      <label>{t(locale, "میزان سرمایه شما برای مهاجرت چقدر است؟", "What is your migration budget?")}<select name="budget" defaultValue=""><option value="">{t(locale, "انتخاب کنید", "Select")}</option>{options([["کمتر از ۵۰۰ میلیون", "Under 500 million toman"], ["۱ الی ۲ میلیارد", "1–2 billion toman"], ["۲ الی ۳ میلیارد", "2–3 billion toman"], ["بالای ۴ میلیارد", "Over 4 billion toman"]])}</select></label>
      <label>{t(locale, "مهارت شما در زبان انگلیسی چقدر است؟", "How strong is your English?")}<select name="language" defaultValue=""><option value="">{t(locale, "انتخاب کنید", "Select")}</option>{options([["عالی", "Excellent"], ["متوسط", "Intermediate"], ["ضعیف", "Beginner"]])}</select></label>
    </div>
    <fieldset className="assessment-form__services"><legend>{t(locale, "در کدام یک از این زمینه‌ها به راهنمایی و خدمات نیاز دارید؟", "What kind of guidance do you need?")}</legend>
      {([
        ["تحصیل در دانشگاه‌های بین‌المللی", "Study at international universities"],
        ["راه‌اندازی یا توسعه کسب‌وکار در خارج از کشور", "Start or expand a business abroad"],
        ["دریافت ویزای استارتاپ و راه‌اندازی کسب‌وکار", "Startup visa and business setup"],
        ["سرمایه‌گذاری در بازارهای بین‌المللی", "Investment in international markets"],
        ["منتورینگ و دریافت مشاوره برای فرایند مهاجرت", "Migration mentoring and consultation"],
        ["نمی‌دانم کدام گزینه برای من مناسب‌تر است، نیاز به مشاوره دارم.", "I am unsure which option suits me; I need advice."],
      ] as [string, string][]).map(([fa, en]) => <label key={en}><input name="service" type="radio" value={t(locale, fa, en)} required />{t(locale, fa, en)}</label>)}
    </fieldset>
    <div className="assessment-form__consents">
      <label><input name="privacyConsent" type="checkbox" required />{t(locale, "با ثبت اطلاعات و شرایط حریم خصوصی موافقم.", "I agree to submit my information under the privacy policy.")} <Link href={`/${locale}/privacy`}>{t(locale, "حریم خصوصی", "Privacy")}</Link></label>
      <label><input name="contactConsent" type="checkbox" required />{t(locale, "با تماس تیم جهان آکادمی برای پیگیری درخواست موافقم.", "I agree to be contacted by Jahan Academy about this request.")}</label>
    </div>
    {status === "error" && <p className="form-error" role="alert">{error}</p>}
    <button className="assessment-form__submit" type="submit" disabled={status === "submitting"}>{status === "submitting" ? copy.sending : t(locale, "ثبت درخواست", "Submit request")}</button>
    <p className="assessment-form__notice">⏰ {t(locale, "کارشناسان ما درخواست شما را در ۷۲ ساعت آینده بررسی خواهند کرد.", "Our team will review your request within 72 hours.")}</p>
  </form>;
}
