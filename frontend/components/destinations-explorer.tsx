import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationsExplorer({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  return <div className={styles.countryGrid}>
    {destinationOverviews.map(item => <article className={styles.countryCard} key={item.slug}>
      <Link className={styles.countryPhoto} href={`/${locale}/countries/${item.slug}`} tabIndex={-1} aria-hidden="true">
        <Image src={item.image} alt={item.imageAlt[locale]} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" />
      </Link>
      <div className={styles.countryBody}>
        <h3 className={styles.countryTitle}><Image className={styles.flag} src={`/destinations/flags/${item.slug}.svg`} alt="" width={18} height={18} /><Link href={`/${locale}/countries/${item.slug}`}>{fa ? `تحصیل در ${item.name.fa}` : `Study in ${item.name.en}`}</Link></h3>
        <p className={styles.countryIntro}>{item.intro[locale]}</p>
        <Link className={styles.countryLink} href={`/${locale}/countries/${item.slug}`}>{fa ? `شروع تحصیل در ${item.name.fa}` : `Explore study in ${item.name.en}`}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link>
      </div>
    </article>)}
  </div>;
}