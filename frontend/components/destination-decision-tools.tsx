"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import { destinationResources } from "@/lib/destination-resources";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationComparison({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const prefix = useId();
  const [selection, setSelection] = useState(["germany", "canada"]);
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({});
  const countries = selection.map(slug => destinationOverviews.find(country => country.slug === slug)!);
  const fields = [
    { key: "course", label: t("دوره و زبان تدریس", "Course and teaching language"), hint: t("نام دوره، زبان و مدرک موردنیاز", "Course, language and required evidence") },
    { key: "cost", label: t("بودجه تحصیل و زندگی", "Study and living budget"), hint: t("شهریه + زندگی؛ مبلغ و واحد پول", "Tuition + living; amount and currency") },
    { key: "deadline", label: t("مهلت درخواست", "Application deadline"), hint: t("تاریخ و لینک صفحه دانشگاه", "Date and university page link") },
    { key: "question", label: t("پرسش باقی‌مانده", "Open question"), hint: t("چه چیزی هنوز نیاز به بررسی دارد؟", "What still needs checking?") },
  ];
  return <div className={styles.comparisonTool}>
    <div className={styles.comparisonSelectors}>{countries.map((country, index) => <label key={index} htmlFor={prefix + "-country-" + index}>
      {t(index === 0 ? "مقصد اول" : "مقصد دوم", index === 0 ? "First destination" : "Second destination")}
      <select id={prefix + "-country-" + index} value={country.slug} onChange={event => setSelection(current => current.map((slug, position) => position === index ? event.target.value : slug))}>
        {destinationOverviews.map(item => <option key={item.slug} value={item.slug} disabled={selection[1 - index] === item.slug}>{item.name[locale]}</option>)}
      </select>
    </label>)}</div>
    <div className={styles.comparisonColumns}>{countries.map(country => {
      const source = destinationResources[country.slug];
      return <article className={styles.comparisonCountry} key={country.slug}>
        <header><Image src={`/destinations/flags/${country.slug}.svg`} width={30} height={30} alt="" /><h3>{country.name[locale]}</h3></header>
        <dl><div><dt>{t("پایتخت", "Capital")}</dt><dd>{country.capital[locale]}</dd></div><div><dt>{t("زبان‌های رایج", "Common languages")}</dt><dd>{country.language[locale]}</dd></div></dl>
        <p className={styles.smallNote}>{t("زبان رایج کشور لزوماً با زبان تدریس دوره یکسان نیست.", "Everyday languages may differ from the course teaching language.")}</p>
        <div className={styles.resourceLinks}><Link href={`/${locale}/countries/${country.slug}`}>{t("راهنمای کشور", "Country guide")} ←</Link><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a></div>
        <div className={styles.comparisonNotes}>{fields.map(field => <label key={field.key} htmlFor={prefix + country.slug + field.key}>{field.label}
          <input id={prefix + country.slug + field.key} type="text" maxLength={300} placeholder={field.hint} value={notes[country.slug]?.[field.key] ?? ""} onChange={event => setNotes(current => ({ ...current, [country.slug]: { ...current[country.slug], [field.key]: event.target.value } }))} />
        </label>)}</div>
      </article>;
    })}</div>
    <p className={styles.smallNote}>{t("یادداشت‌ها فقط در همین صفحه می‌مانند و با بارگذاری مجدد پاک می‌شوند. برای مقایسه هزینه‌ها، واحد پول و بازه زمانی یکسان در نظر بگیرید.", "Notes stay on this page and clear on reload. Compare costs using the same currency and time period.")}</p>
  </div>;
}

export function DestinationReadiness({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const [checked, setChecked] = useState<number[]>([]);
  const items = [
    [t("هدف و مقطع را مشخص کرده‌ام", "I have defined my goal and qualification"), t("رشته، مقطع و زمان دلخواه شروع تحصیل.", "Subject, qualification and preferred start date.")],
    [t("دو کشور را دقیق‌تر بررسی کرده‌ام", "I have explored two countries"), t("برای هر کشور، یک شهر و دوره قابل بررسی انتخاب کنید.", "Choose a city and a course to investigate in each country.")],
    [t("بودجه اولیه را نوشته‌ام", "I have outlined an initial budget"), t("شهریه، مسکن، مخارج روزمره و هزینه شروع مسیر.", "Tuition, housing, daily expenses and initial costs.")],
    [t("شرایط زبان و مدارک را خوانده‌ام", "I have read language and document requirements"), t("پیش‌نیازها را در صفحه همان دوره بررسی کنید.", "Check prerequisites on the course’s own page.")],
    [t("مهلت‌های درخواست را ثبت کرده‌ام", "I have recorded application deadlines"), t("تاریخ دانشگاه و بورسیه را جداگانه بنویسید.", "Record university and scholarship dates separately.")],
    [t("پرسش‌های جلسه مشاوره را آماده کرده‌ام", "I have prepared consultation questions"), t("ابهام‌های هزینه، شهر، دوره و مراحل بعد را بنویسید.", "List open questions about costs, cities, courses and next steps.")],
  ];
  const count = new Intl.NumberFormat(locale).format(checked.length);
  return <div className={styles.readiness}>
    <div className={styles.readinessStatus}><strong role="status">{t(`${count} مورد از ۶ مورد بررسی شده`, `${count} of 6 items reviewed`)}</strong><progress value={checked.length} max={6} aria-label={t("پیشرفت بررسی مقصد", "Destination review progress")} /></div>
    <div className={styles.readinessGrid}>{items.map(([title, text], index) => <label className={styles.readinessItem} key={title}><input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])} /><span><strong>{title}</strong><span>{text}</span></span></label>)}</div>
    <div className={styles.readinessFooter}><p>{t("این چک‌لیست برای نظم‌دادن به بررسی شماست و ارزیابی شانس پذیرش نیست.", "This checklist organises your research; it is not an admission assessment.")}</p><button type="button" disabled={!checked.length} onClick={() => setChecked([])}>{t("شروع دوباره", "Reset checklist")}</button></div>
  </div>;
}
