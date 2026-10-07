import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import { destinationCountryFacts } from "@/lib/destination-country-facts";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationComparison({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const fields = [["living", t("هزینه زندگی دانشجویی", "Student living costs")], ["tuition", t("شهریه سالانه", "Annual tuition")], ["work", t("امکان کار دانشجویی", "Student work allowance")], ["stay", t("اقامت پس از تحصیل", "Post-study stay")]] as const;
  return <div className={styles.comparisonTool}>
    <div className={styles.comparisonTableWrap} role="region" aria-labelledby="destination-comparison-title" tabIndex={0}>
      <table className={styles.comparisonTable}>
        <caption className={styles.srOnly}>{t("مقایسه اطلاعات کلی مقصدهای تحصیلی", "Study destinations: general information comparison")}</caption>
        <thead><tr><th scope="col">{t("کشور", "Country")}</th>{fields.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead>
        <tbody>{destinationOverviews.map(country => <tr key={country.slug}>
          <th scope="row"><Link className={styles.tableCountry} href={`/${locale}/countries/${country.slug}`}><Image src={`/destinations/flags/${country.slug}.svg`} width={30} height={30} alt="" /><span>{country.name[locale]}</span></Link></th>
          {fields.map(([key]) => {
        const fact = destinationCountryFacts[country.slug][key];
        return <td key={key}><div className={styles.tableFact}><strong>{fact.value[locale]}</strong><span>{fact.note[locale]}</span></div></td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
    <p className={styles.smallNote}>{t("ارقام، برآورد عمومی برای دانشجوی بین‌المللی‌اند و هزینه واقعی به شهر و شرایط فردی بستگی دارد. اجازه کار و اقامت پس از تحصیل مشروط به احراز شرایط است و به معنی اقامت دائم نیست.", "Figures are general international-student estimates; actual costs depend on the city and individual circumstances. Work and post-study permits require eligibility and do not imply permanent residence.")}</p>
  </div>;
}
