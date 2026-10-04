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
  const artwork = {
    permit: <>
      <rect x="6" y="5" width="18" height="24" rx="2.5" fill="#bceee5" />
      <rect x="4" y="3" width="18" height="24" rx="2.5" fill="#179b89" />
      <rect x="6" y="6" width="14" height="18" rx="1" fill="#effbf8" />
      <path d="M10 3V2h6v1" stroke="#117568" strokeWidth="1.5" /><rect x="9" y="3" width="8" height="4" rx="1" fill="#73d3be" />
      <path d="M9 11h8M9 15h6M9 19h4" stroke="#55aa9b" strokeWidth="1.4" />
      <circle cx="23" cy="23" r="7" fill="#fff" /><circle cx="23" cy="23" r="5.8" fill="#20bfa3" />
      <path d="m20 23 2 2 4-4" stroke="#fff" strokeWidth="1.8" />
    </>,
    internship: <g transform="rotate(-14 16 17)">
      <path d="M11 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" stroke="#1556c4" strokeWidth="2.5" />
      <rect x="3" y="9" width="26" height="19" rx="3" fill="#155bd7" />
      <path d="M3 19h26v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill="#1249ae" />
      <path d="M3 11a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v7l-13 3-13-3Z" fill="#2f83ff" />
      <path d="M7 11h6" stroke="#9bcaff" strokeWidth="1.5" /><rect x="14" y="17" width="4" height="5" rx="1" fill="#d5eaff" />
    </g>,
    work: <>
      <path d="M5 7h22v22H5Z" fill="#7354cf" /><path d="M4 4h24v4H4Z" fill="#9c81ec" />
      <path d="M8 10h16v16H8Z" fill="#ebe4ff" /><path d="M8 16h16M16 10v11" stroke="#a58add" strokeWidth="1.3" />
      <path d="M11 12h2v2h-2Zm8 0h2v2h-2Z" fill="#f7c664" />
      <circle cx="11.5" cy="19" r="1.7" fill="#f4b088" /><path d="M9 24v-2a2.5 2.5 0 0 1 5 0v2" fill="#39bfa9" />
      <circle cx="20.5" cy="19" r="1.7" fill="#f4b088" /><path d="M18 24v-2a2.5 2.5 0 0 1 5 0v2" fill="#f08b9c" />
      <path d="M14 24h4v5h-4Z" fill="#4d329b" /><path d="M3 29h26" stroke="#50369d" strokeWidth="2" />
    </>,
    offer: <g transform="rotate(12 16 17)">
      <path d="m3 14 13-9 13 9v14H3Z" fill="#e79b2f" />
      <rect x="8" y="3" width="16" height="20" rx="2" fill="#fff1cd" />
      <path d="M11 8h7M11 12h10M11 16h7" stroke="#dba74e" strokeWidth="1.3" />
      <path d="m3 14 13 9 13-9v14H3Z" fill="#ffc86b" /><path d="m3 28 10-9a4 4 0 0 1 6 0l10 9" fill="#ffdf9e" />
      <circle cx="23" cy="7" r="5" fill="#f08b39" /><path d="m21 7 1.4 1.4L25 6" stroke="#fff" strokeWidth="1.5" />
    </g>,
    home: <>
      <path d="M7 13h18v16H7Z" fill="#ffb5c8" /><path d="M19 5h4v7h-4Z" fill="#d94072" />
      <path d="m3 14 13-11 13 11-2 2-11-9-11 9Z" fill="#ed5483" />
      <path d="m8 13 8-6 8 6Z" fill="#fff0f4" /><rect x="13" y="10" width="6" height="5" rx="1" fill="#f68fab" />
      <path d="M10 18h5v5h-5Zm10 0h3v5h-3Z" fill="#fff5f8" /><path d="M16 20h5v9h-5Z" fill="#b92e5b" />
      <path d="M5 29h22" stroke="#cf3c69" strokeWidth="2" /><path d="M16 29h5" stroke="#ffe0e8" strokeWidth="2" />
    </>,
  };
  return <svg aria-hidden="true" focusable="false" width="32" height="32" viewBox="0 0 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round">{artwork[icon]}</svg>;
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
      <div className={styles.highlights}>{u.features.map((feature, index) => <article className={styles.lifeCard} key={feature.title.en}>
        <span className={styles.lifeIcon}><CampusLifeIcon index={index} /></span><h4>{feature.title[locale]}</h4><p>{feature.text[locale]}</p>
      </article>)}</div>
    </section>}
  </>;
  const features = <>
    <h2>{fa ? `امکانات و ویژگی‌های ${u.name.fa}` : `What we offer at ${u.englishName}`}</h2>
    {offerings.length ? <div className={styles.featureList}>{offerings.map((feature, index) => {
      const url = safeUniversityUrl(feature.url);
      return <details className={styles.featureItem} key={feature.title.en}>
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
          <h3 id="top-disciplines-title">{u.topDisciplines?.length ? (fa ? "رشته‌های برتر" : "Top Disciplines") : (fa ? "حوزه‌های تحصیلی" : "Academic fields")}</h3>
          {u.topDisciplines?.length ? <ul className={styles.disciplineList}>{u.topDisciplines.map((discipline) => <li key={discipline.name.en}>
            <div className={styles.disciplineLabel}><span>{discipline.name[locale]}</span><span>{discipline.percentage.toLocaleString(locale)}{fa ? "٪" : "%"}</span></div>
            <meter min={0} max={100} value={discipline.percentage} aria-label={discipline.name[locale]}>{discipline.percentage}%</meter>
          </li>)}</ul> : u.academicFields?.length ? <ul className={styles.academicFields}>{u.academicFields.map((field) => <li key={field.en}>{field[locale]}</li>)}</ul> : <p className={styles.disciplinesEmpty}>{fa ? "اطلاعات رشته‌های این دانشگاه هنوز منتشر نشده است." : "Academic field information has not yet been published for this university."}</p>}
        </section>
      </aside>
    </div>
  </main></SiteShell></div>;
}
