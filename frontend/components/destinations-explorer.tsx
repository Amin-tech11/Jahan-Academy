import Image from "next/image";
import Link from "next/link";
import { destinationOverviews } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

const highlights: Record<string, { fa: string; en: string }> = {
  germany: { fa: "شناخت شهرهای دانشگاهی و مسیر تحصیلی", en: "Explore university cities and study pathways" },
  canada: { fa: "آشنایی با شهرها و فضای چندزبانه", en: "Discover cities and multilingual communities" },
  "united-kingdom": { fa: "تحصیل و زندگی در محیط انگلیسی‌زبان", en: "Study and life in an English-speaking setting" },
  italy: { fa: "تجربه تحصیل در کنار تاریخ و فرهنگ", en: "Explore study alongside history and culture" },
  netherlands: { fa: "شناخت دوره‌ها و زندگی در شهرهای هلند", en: "Discover courses and life in Dutch cities" },
  australia: { fa: "آشنایی با شهرها و سبک زندگی استرالیا", en: "Explore Australian cities and lifestyle" },
  sweden: { fa: "شناخت تحصیل و زندگی در شمال اروپا", en: "Explore study and life in northern Europe" },
  finland: { fa: "بررسی زبان، شهر و هدف تحصیلی", en: "Consider language, city and academic goals" },
  denmark: { fa: "آشنایی با محیط شهرهای دانشگاهی", en: "Discover the setting of university cities" },
  "new-zealand": { fa: "زندگی دانشگاهی در کنار طبیعت", en: "Discover university life and natural surroundings" },
};

export function DestinationsExplorer({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  return <div className={styles.countryGrid}>
    {destinationOverviews.map(item => <article className={styles.countryCard} key={item.slug}>
      <Link className={styles.countryPhoto} href={`/${locale}/countries/${item.slug}`} tabIndex={-1} aria-hidden="true">
        <Image src={item.image} alt={item.imageAlt[locale]} fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw" />
      </Link>
      <div className={styles.countryBody}>
        <p className={styles.countryHighlight}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg><span>{highlights[item.slug][locale]}</span></p>
        <h3 className={styles.countryTitle}><Image className={styles.flag} src={`/destinations/flags/${item.slug}.svg`} alt="" width={18} height={18} /><Link href={`/${locale}/countries/${item.slug}`}>{fa ? `تحصیل در ${item.name.fa}` : `Study in ${item.name.en}`}</Link></h3>
        <p className={styles.countryIntro}>{item.intro[locale]}</p>
        <Link className={styles.countryLink} href={`/${locale}/countries/${item.slug}`}>{fa ? `شروع تحصیل در ${item.name.fa}` : `Explore study in ${item.name.en}`}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link>
      </div>
    </article>)}
  </div>;
}