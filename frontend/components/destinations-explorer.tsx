"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { destinationCount, filterDestinations, regionLabels, type Region } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationsExplorer({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region>("all");
  const results = filterDestinations(query, region);
  return <>
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label={fa ? "فیلتر منطقه" : "Filter by region"}>
        {(Object.keys(regionLabels) as Region[]).map((key) => <button key={key} type="button" aria-pressed={region === key} onClick={() => setRegion(key)}>{regionLabels[key][locale]}</button>)}
      </div>
      <label className={styles.search}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <span className={styles.srOnly}>{fa ? "جست‌وجوی کشور" : "Search countries"}</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={fa ? "کدام کشور را در نظر دارید؟" : "Which country is on your mind?"} />
      </label>
    </div>
    <p className={styles.resultCount} role="status" aria-live="polite">{fa ? `${destinationCount(results.length, locale)} مقصد برای کشف کردن` : `${results.length} ${results.length === 1 ? "destination" : "destinations"} to explore`}</p>
    {results.length ? <div className={styles.countryGrid}>
      {results.map((item) => <article className={styles.countryCard} key={item.slug}>
        <Link className={styles.countryPhoto} href={`/${locale}/countries/${item.slug}`} tabIndex={-1} aria-hidden="true">
          <Image src={item.image} alt={item.imageAlt[locale]} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
          <span className={styles.regionBadge}>{regionLabels[item.region][locale]}</span>
        </Link>
        <div className={styles.countryBody}>
          <div className={styles.countryTitle}><div><span className={styles.englishName} lang="en">{fa ? item.name.en : "STUDY DESTINATION"}</span><h3><Link href={`/${locale}/countries/${item.slug}`}>{item.name[locale]}</Link></h3></div><Image className={styles.flag} src={`/destinations/flags/${item.slug}.svg`} alt="" width={42} height={42} /></div>
          <p>{item.intro[locale]}</p>
          <dl className={styles.facts}><div><dt>{fa ? "پایتخت" : "Capital"}</dt><dd>{item.capital[locale]}</dd></div><div><dt>{fa ? "زبان‌های رایج" : "Common languages"}</dt><dd>{item.language[locale]}</dd></div></dl>
          <Link className={styles.countryLink} href={`/${locale}/countries/${item.slug}`}>{fa ? `آشنایی با ${item.name.fa}` : `Explore ${item.name.en}`}<span aria-hidden="true">{fa ? "↖" : "↗"}</span></Link>
        </div>
      </article>)}
    </div> : <div className={styles.empty}><span aria-hidden="true">⌕</span><h3>{fa ? "مقصدی با این جست‌وجو پیدا نشد" : "No destinations found"}</h3><p>{fa ? "نام کشور را تغییر دهید یا فیلترها را پاک کنید." : "Try a different country name or clear the filters."}</p><button className={styles.primary} onClick={() => { setQuery(""); setRegion("all"); }} type="button">{fa ? "نمایش همه مقصدها" : "Show all destinations"}</button></div>}
    <p className={styles.caption}>{fa ? "زبان‌های رایج هر کشور با زبان تدریس یکسان نیست؛ زبان و شرایط هر دوره باید جداگانه بررسی شود." : "Common languages are not necessarily teaching languages; check the language and requirements of each course separately."}</p>
  </>;
}
