import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import { countryFactsReviewedAt, destinationCountryFacts } from "@/lib/destination-country-facts";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationComparison({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const fields = [["living", t("هزینه زندگی دانشجویی", "Student living costs")], ["tuition", t("شهریه سالانه", "Annual tuition")], ["work", t("امکان کار دانشجویی", "Student work allowance")], ["stay", t("اقامت پس از تحصیل", "Post-study stay")]] as const;
  return <div className={styles.comparisonTool}>
    <div className={styles.comparisonColumns}>{destinationOverviews.map(country => <article className={styles.comparisonCountry} key={country.slug} aria-labelledby={`facts-${country.slug}`}>
      <header><Image src={`/destinations/flags/${country.slug}.svg`} width={36} height={36} alt="" /><div><h3 id={`facts-${country.slug}`}>{country.name[locale]}</h3><span className={styles.factCapital}>{country.capital[locale]}</span></div></header>
      <dl>{fields.map(([key, label]) => {
        const fact = destinationCountryFacts[country.slug][key];
        return <div className={styles.factRow} key={key}><dt>{label}</dt><dd><strong>{fact.value[locale]}</strong><span>{fact.note[locale]}</span><a href={fact.source} target="_blank" rel="noopener noreferrer" aria-label={`${t("منبع رسمی", "Official source")}: ${label} — ${country.name[locale]}`}>{t("منبع رسمی", "Official source")} ↗</a></dd></div>;
      })}</dl>
      <Link className={styles.factDestinationLink} href={`/${locale}/countries/${country.slug}`}>{t("معرفی", "Explore")} {country.name[locale]} <span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link>
    </article>)}</div>
    <p className={styles.smallNote}>{t("ارقام، برآورد عمومی برای دانشجوی بین‌المللی‌اند و هزینه واقعی به شهر و شرایط فردی بستگی دارد. اجازه کار و اقامت پس از تحصیل مشروط به احراز شرایط است و به معنی اقامت دائم نیست. بررسی منابع: ۷ اکتبر ۲۰۲۶.", "Figures are general international-student estimates; actual costs depend on the city and individual circumstances. Work and post-study permits require eligibility and do not imply permanent residence. Sources reviewed: 7 October 2026.")}<time dateTime={countryFactsReviewedAt} className={styles.srOnly}>{countryFactsReviewedAt}</time></p>
  </div>;
}
