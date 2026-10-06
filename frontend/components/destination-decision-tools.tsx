"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationComparison({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const prefix = useId();
  const [selection, setSelection] = useState(["germany", "canada"]);
  const countries = selection.map(slug => destinationOverviews.find(country => country.slug === slug)!);
  return <div className={styles.comparisonTool}>
    <div className={styles.comparisonSelectors}>{countries.map((country, index) => <label key={index} htmlFor={prefix + "-country-" + index}>
      {t(index === 0 ? "مقصد اول" : "مقصد دوم", index === 0 ? "First destination" : "Second destination")}
      <select id={prefix + "-country-" + index} value={country.slug} onChange={event => setSelection(current => current.map((slug, position) => position === index ? event.target.value : slug))}>
        {destinationOverviews.map(item => <option key={item.slug} value={item.slug} disabled={selection[1 - index] === item.slug}>{item.name[locale]}</option>)}
      </select>
    </label>)}</div>
    <div className={styles.comparisonColumns}>{countries.map(country => <article className={styles.comparisonCountry} key={country.slug}>
      <header><Image src={`/destinations/flags/${country.slug}.svg`} width={30} height={30} alt="" /><h3>{country.name[locale]}</h3></header>
      <dl><div><dt>{t("پایتخت", "Capital")}</dt><dd>{country.capital[locale]}</dd></div><div><dt>{t("زبان‌های رایج", "Common languages")}</dt><dd>{country.language[locale]}</dd></div></dl>
      <p>{country.intro[locale]}</p>
      <div className={styles.resourceLinks}><Link href={`/${locale}/countries/${country.slug}`}>{t("آشنایی با مقصد", "Explore the destination")} {locale === "fa" ? "←" : "→"}</Link></div>
    </article>)}</div>
    <div className={styles.resourceLinks}><a href="#destination-consultation">{t("درخواست مشاوره رایگان", "Request free consultation")}</a></div>
  </div>;
}
