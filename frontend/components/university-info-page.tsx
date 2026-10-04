import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { UniversityGallery, UniversityTabs } from "@/components/university-info-interactive";
import type { Locale } from "@/lib/site-content";
import { safeUniversityUrl, universityIdentityLocation, universityMapEmbedUrl, type UniversityInfo, type UniversityOffering } from "@/lib/university-info-model";
import styles from "./university-info.module.css";

function Pin() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.6" /></svg>;
}

function OfferingIcon({ icon }: { icon: UniversityOffering["icon"] }) {
  const paths = {
    permit: <><path d="M7 3h9l3 3v7M7 3v18h6M10 8h5M10 12h3" /><circle cx="17" cy="17" r="5" /><path d="m15 17 1.5 1.5L19 16" /></>,
    internship: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12l9 3 9-3M12 13v4" /></>,
    work: <><path d="M3 21h18M5 21V4h14v17M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5" /></>,
    offer: <><path d="M3 10v11h18V10M3 10l9 7 9-7M7 12V3h10v9M10 6h4M10 9h3" /></>,
    home: <><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7M10 8h4" /></>,
  };
  return <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[icon]}</svg>;
}

function CampusLifeIcon({ index }: { index: number }) {
  const paths = [
    <path key="campus" d="M5 19c0-7 5-12 14-14 0 9-5 14-12 14M5 19l8-8M4 20l1-1" />,
    <path key="residence" d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" />,
    <path key="library" d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15" />,
  ];
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[index % paths.length]}</svg>;
}

export function UniversityInfoPage({ university: u, locale }: { university: UniversityInfo; locale: Locale }) {
  const fa = locale === "fa";
  const website = safeUniversityUrl(u.websiteUrl);
  const identityLocation = universityIdentityLocation(u);
  const offerings: (UniversityInfo["features"][number] & Partial<Pick<UniversityOffering, "icon" | "status">>)[] = u.offerings ?? u.features;
  const facts = [
    { label: fa ? "کشور" : "Country", value: u.country[locale] },
    ...(u.city ? [{ label: fa ? "شهر" : "City", value: u.city[locale] }] : []),
    ...(u.institutionType ? [{ label: fa ? "نوع مؤسسه" : "Institution type", value: u.institutionType[locale] }] : []),
    ...(u.foundedYear ? [{ label: fa ? "سال تأسیس" : "Founded", value: String(u.foundedYear) }] : []),
    ...(u.dli ? [{ label: fa ? "شماره DLI" : "DLI number", value: u.dli }] : []),
  ];
  const location = <section className={styles.campusLocation} aria-label={fa ? `موقعیت ${u.name.fa}` : `Location for ${u.englishName}`}>
    <h2>{fa ? `موقعیت ${u.name.fa}` : `Location for ${u.englishName}`}</h2>
    <span className={styles.mapLabel}>{fa ? "نقشه" : "Map"}</span>
    <figure className={styles.campusMap}>
      <div className={styles.mapCanvas}>
        <iframe src={universityMapEmbedUrl(u)} title={fa ? `نقشهٔ ${u.name.fa}` : `Map of ${u.englishName}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        <div className={styles.mapInfo} dir="ltr" lang="en"><strong>{u.englishName}</strong><span>{u.address || u.location.en}</span></div>
      </div>
      <figcaption dir="ltr" lang="en">{u.address || u.location.en}</figcaption>
    </figure>
  </section>;
  const overview = <>
    <h2>{fa ? `درباره ${u.name.fa}` : `About ${u.name.en}`}</h2>
    <p className={styles.prose}>{u.about[locale] || (fa ? "معرفی دانشگاه هنوز منتشر نشده است." : "An introduction has not yet been published.")}</p>
    {!!u.whyChoose?.length && <section>
      <h3 className={styles.subheading}>{fa ? `چرا ${u.name.fa}؟` : `Why ${u.englishName}?`}</h3>
      <ul className={styles.reasonList}>{u.whyChoose.map((reason) => <li key={reason.title.en}><strong>{reason.title[locale]}:</strong> {reason.text[locale]}</li>)}</ul>
    </section>}
    {!!u.notes?.length && <section className={styles.notesBox} aria-labelledby="university-notes-title">
      <h3 id="university-notes-title">{fa ? "نکات مهم" : "Important notes"}</h3>
      {u.notes.map((note) => <p key={note.title.en}><strong>{note.title[locale]}:</strong> {note.text[locale]}</p>)}
    </section>}
    {!!u.features.length && <section className={styles.lifeSection}>
      <h3 className={styles.subheading}>{fa ? "زندگی در این دانشگاه" : "Life at this university"}</h3>
      <div className={styles.highlights}>{u.features.map((feature, index) => <article className={styles.lifeCard} key={feature.url}>
        <span className={styles.lifeIcon}><CampusLifeIcon index={index} /></span><h4>{feature.title[locale]}</h4><p>{feature.text[locale]}</p>
      </article>)}</div>
    </section>}
  </>;
  const features = <>
    <h2>{fa ? `امکانات و ویژگی‌های ${u.name.fa}` : `What we offer at ${u.englishName}`}</h2>
    {offerings.length ? <div className={styles.featureList}>{offerings.map((feature, index) => {
      const url = safeUniversityUrl(feature.url);
      return <details className={styles.featureItem} key={feature.url}>
        <summary className={styles.featureSummary}>
          <span className={styles.featureIcon}>{feature.icon ? <OfferingIcon icon={feature.icon} /> : <CampusLifeIcon index={index} />}</span>
          <span className={styles.featureTitle}>{feature.title[locale]}</span>
          {feature.status && <span className={styles.featureStatus}>{feature.status[locale]}</span>}
          <svg className={styles.featureChevron} aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </summary>
        <div className={styles.featureDescription}><p>{feature.text[locale]}</p>{url && <a href={url} target="_blank" rel="noopener noreferrer">{fa ? "جزئیات در وب‌سایت رسمی" : "Details on the official website"} ↗</a>}</div>
      </details>;
    })}</div> : <p className={styles.prose}>{fa ? "جزئیات ویژگی‌های این دانشگاه هنوز منتشر نشده است." : "Campus feature details have not yet been published for this university."}</p>}
  </>;
  return <div className={styles.panel}><SiteShell locale={locale}><main className={styles.main}>
    <nav className={styles.breadcrumb} aria-label={fa ? "مسیر صفحه" : "Breadcrumb"}><Link href={`/${locale}`}>{fa ? "صفحه اصلی" : "Home"}</Link><span aria-hidden="true">/</span><Link href={`/${locale}/universities`}>{fa ? "دانشگاه‌ها" : "Universities"}</Link><span aria-hidden="true">/</span><span aria-current="page">{u.name[locale]}</span></nav>
    <header className={styles.identity} dir="ltr" lang="en">
      <div className={styles.logo}>{u.logo ? <Image src={u.logo} alt={`${u.englishName} logo`} width={64} height={64} /> : <span aria-hidden="true">{u.englishName.split(" ").slice(0, 2).map((word) => word[0]).join("")}</span>}</div>
      <div className={styles.identityText}>
        <h1>{website ? <a className={styles.nameLink} href={website} target="_blank" rel="noopener noreferrer">{u.englishName}</a> : u.englishName}</h1>
        <div className={styles.location}>
          <span className={styles.cityLocation}>{identityLocation.flag && <Image src={identityLocation.flag} alt={u.country.en} width={24} height={24} />}<span>{identityLocation.label}</span></span>
          {identityLocation.address && <span className={styles.streetAddress}><Pin /><span>{identityLocation.address}</span></span>}
        </div>
      </div>
    </header>
    <UniversityGallery photos={u.photos} name={u.name[locale]} locale={locale} />
    <div className={styles.contentGrid}>
      <UniversityTabs locale={locale} overview={overview} features={features} location={location} />
      <aside className={styles.sidebar} aria-label={fa ? "مشخصات دانشگاه" : "Institution details"}>
        <section className={styles.factCard}><h2>{fa ? "مشخصات دانشگاه" : "Institution details"}</h2><dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd dir="auto">{fact.value}</dd></div>)}</dl></section>
        <section className={styles.disciplinesCard} aria-labelledby="top-disciplines-title">
          <h3 id="top-disciplines-title">{fa ? "رشته‌های برتر" : "Top Disciplines"}</h3>
          {u.topDisciplines?.length ? <ul className={styles.disciplineList}>{u.topDisciplines.map((discipline) => <li key={discipline.name.en}>
            <div className={styles.disciplineLabel}><span>{discipline.name[locale]}</span><span>{discipline.percentage.toLocaleString(locale)}{fa ? "٪" : "%"}</span></div>
            <meter min={0} max={100} value={discipline.percentage} aria-label={discipline.name[locale]}>{discipline.percentage}%</meter>
          </li>)}</ul> : <p className={styles.disciplinesEmpty}>{fa ? "اطلاعات رشته‌های برتر این دانشگاه هنوز منتشر نشده است." : "Top discipline information has not yet been published for this university."}</p>}
        </section>
      </aside>
    </div>
  </main></SiteShell></div>;
}
