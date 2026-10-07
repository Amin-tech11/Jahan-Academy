"use client";

import { useState } from "react";
import type { Locale } from "@/lib/site-content";
import styles from "./consultation-success.module.css";

export function ConsultationSuccess({ locale, reference, duplicate = false }: {
  locale: Locale;
  reference: string;
  duplicate?: boolean;
}) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  async function copyReference() {
    if (copyStatus === "copying") return;
    setCopyStatus("copying");
    try {
      await navigator.clipboard.writeText(reference);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }
  return <section className={styles.receipt} role="status" aria-live="polite" dir={locale === "fa" ? "rtl" : "ltr"}>
    <span className={styles.icon} aria-hidden="true">✓</span>
    <h3 className={styles.title}>{t("درخواست شما با موفقیت دریافت شد.", "Your request has been received successfully.")}</h3>
    <p className={styles.description}>{t("درخواست مشاوره شما با موفقیت دریافت شد. تیم ما اطلاعات شما را بررسی میکنند و با شما تماس میگیرند.", "Your consultation request has been received. Our team will review your information and contact you.")}</p>
    {duplicate && <p className={styles.note}>{t("این درخواست قبلاً ثبت شده است؛ کد پیگیری قبلی شما معتبر است.", "This request was already received; your existing reference code remains valid.")}</p>}
    <div className={styles.code}>
      <button className={styles.copy} type="button" onClick={copyReference} disabled={copyStatus === "copying"} aria-label={t("کپی کد پیگیری", "Copy reference code")}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>
        {copyStatus === "copied" ? t("کپی شد", "Copied") : t("کپی", "Copy")}
      </button>
      <span>{t("کد پیگیری", "Reference code")}</span>
      <strong dir="ltr">{reference}</strong>
    </div>
    {copyStatus === "error" && <p className={styles.note} role="alert">{t("کپی خودکار انجام نشد. کد پیگیری را انتخاب و کپی کنید.", "Could not copy automatically. Select and copy your reference code.")}</p>}
  </section>;
}
