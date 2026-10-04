import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { UniversityGallery, UniversityTabs } from "@/components/university-info-interactive";
import type { Locale } from "@/lib/site-content";
import { safeUniversityUrl, type UniversityInfo } from "@/lib/university-info-model";
import styles from "./university-info.module.css";

function Pin() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.6" /></svg>;
}

export function UniversityInfoPage({ university: u, locale }: { university: UniversityInfo; locale: Locale }) {
  const fa = locale === "fa";
  const website = safeUniversityUrl(u.websiteUrl);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${u.englishName}, ${u.address || u.location.en}`)}`;
  const facts = [
    { label: fa ? "کشور" : "Country", value: u.country[locale] },
    ...(u.city ? [{ label: fa ? "شهر" : "City", value: u.city[locale] }] : []),
    ...(u.institutionType ? [{ label: fa ? "نوع مؤسسه" : "Institution type", value: u.institutionType[locale] }] : []),
    ...(u.foundedYear ? [{ label: fa ? "سال تأسیس" : "Founded", value: String(u.foundedYear) }] : []),
    ...(u.dli ? [{ label: fa ? "شماره DLI" : "DLI number", value: u.dli }] : []),
  ];
  const location = <>
    <p className={styles.eyebrow}>{fa ? "دانشگاه روی نقشه" : "FIND YOUR CAMPUS"}</p>
    <h2>{fa ? "اینجا را بهتر بشناسید" : "Get to know the location"}</h2>
    <div className={styles.locationCard}><span className={styles.pinBadge}><Pin /></span><div><h3>{u.location[locale]}</h3><p dir="ltr">{u.address || u.location.en}</p></div></div>
    <a className={styles.secondaryButton} href={mapUrl} target="_blank" rel="noopener noreferrer">{fa ? "مشاهده در Google Maps" : "Open in Google Maps"}<span aria-hidden="true">↗</span></a>
  </>;
  const overview = <>
    <p className={styles.eyebrow}>{fa ? "یک نگاه نزدیک‌تر" : "A CLOSER LOOK"}</p>
    <h2>{fa ? `درباره ${u.name.fa}` : `About ${u.name.en}`}</h2>
    <p className={styles.prose}>{u.about[locale] || (fa ? "معرفی دانشگاه هنوز منتشر نشده است." : "An introduction has not yet been published.")}</p>
    {!!u.features.length && <><h3 className={styles.subheading}>{fa ? "زندگی در این دانشگاه" : "Life at this university"}</h3><div className={styles.highlights}>{u.features.map((feature, index) => <div key={feature.url}><span>{String(index + 1).padStart(2, "0")}</span><h4>{feature.title[locale]}</h4><p>{feature.text[locale]}</p></div>)}</div></>}
    {!!u.sources.length && <div className={styles.sources}><span>{fa ? "منابع اطلاعات" : "Information sources"}</span>{u.sources.map((source) => safeUniversityUrl(source.url) && <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>)}</div>}
  </>;
  const features = <>
    <p className={styles.eyebrow}>{fa ? "در فضای دانشگاه" : "ON CAMPUS"}</p><h2>{fa ? "ویژگی‌های دانشگاه" : "Campus features"}</h2>
    {u.features.length ? <div className={styles.featureList}>{u.features.map((feature, index) => <article key={feature.url}><span aria-hidden="true">{["⌂", "◇", "▤"][index % 3]}</span><div><h3>{feature.title[locale]}</h3><p>{feature.text[locale]}</p>{safeUniversityUrl(feature.url) && <a href={feature.url} target="_blank" rel="noopener noreferrer">{fa ? "اطلاعات رسمی" : "Official information"} ↗</a>}</div></article>)}</div> : <p className={styles.prose}>{fa ? "جزئیات ویژگی‌های این دانشگاه هنوز منتشر نشده است." : "Campus feature details have not yet been published for this university."}</p>}
  </>;
  return <div className={styles.panel}><SiteShell locale={locale}><main className={styles.main}>
    <nav className={styles.breadcrumb} aria-label={fa ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{fa ? "صفحه اصلی" : "Home"}</Link><span aria-hidden="true">/</span><Link href={`/${locale}/universities`}>{fa ? "دانشگاه‌ها" : "Universities"}</Link><span aria-hidden="true">/</span><span aria-current="page">{u.name[locale]}</span></nav>
    <header className={styles.identity} dir="ltr" lang="en">
      <div className={styles.logo}>{u.logo ? <Image src={u.logo} alt={`${u.englishName} logo`} width={68} height={68} /> : <span aria-hidden="true">{u.englishName.split(" ").slice(0, 2).map((word) => word[0]).join("")}</span>}</div>
      <div className={styles.identityText}>
        <h1>{website ? <a className={styles.nameLink} href={website} target="_blank" rel="noopener noreferrer">{u.englishName}</a> : u.englishName}</h1>
        <div className={styles.location}><Pin /><span>{u.location.en}</span>{u.institutionType && <span className={styles.tag}>{u.institutionType.en}</span>}</div>
      </div>
    </header>
    <UniversityGallery photos={u.photos} name={u.name[locale]} locale={locale} />
    <div className={styles.contentGrid}>
      <UniversityTabs locale={locale} overview={overview} features={features} location={location} />
      <aside className={styles.sidebar} aria-label={fa ? "مشخصات دانشگاه" : "Institution details"}>
        <section className={styles.factCard}><p className={styles.eyebrow}>{fa ? "در یک نگاه" : "AT A GLANCE"}</p><h2>{fa ? "مشخصات دانشگاه" : "Institution details"}</h2><dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd dir="auto">{fact.value}</dd></div>)}</dl>{website && <a href={website} target="_blank" rel="noopener noreferrer" className={styles.domain}>{new URL(website).hostname} ↗</a>}</section>
        <section className={styles.locationAside}><Pin /><h3>{fa ? "موقعیت دانشگاه" : "Campus location"}</h3><p dir="auto">{u.location[locale]}</p><a href={mapUrl} target="_blank" rel="noopener noreferrer">{fa ? "دیدن موقعیت روی نقشه" : "View location on map"} ↗</a></section>
      </aside>
    </div>
    <div className={styles.returnBar}><span>{fa ? "هر دانشگاه، یک دنیای تازه" : "Every university, a new perspective"}</span><Link href={`/${locale}/universities`}>{fa ? "بازگشت به دانشگاه‌ها" : "Back to universities"}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link></div>
  </main></SiteShell></div>;
}
