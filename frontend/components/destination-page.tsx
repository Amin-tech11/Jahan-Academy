"use client";

import Image from "next/image";
import { DestinationConsultation } from "./destination-consultation";
import consultationStyles from "./destination-consultation.module.css";
import { DestinationCollage } from "./destination-collage";
import { destinationCollages } from "@/lib/destination-collages";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { destinations, destinationConsultationHref, type Destination } from "@/lib/destination-content";
import { homeUniversities } from "@/lib/home-universities";
import { trackDestinationSections } from "@/lib/destination-section-tracker";
import type { Locale } from "@/lib/site-content";
import styles from "./destination-page.module.css";

export function DestinationPage({ destination: d, locale }: { destination: Destination; locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const [active, setActive] = useState<string | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);
  const universities = homeUniversities.filter((university) => university.country === d.slug);
  const collages = destinationCollages(d, universities);
  const currencySymbol = new Intl.NumberFormat("en", { style: "currency", currency: d.currency, currencyDisplay: "narrowSymbol" }).formatToParts(0).find(({ type }) => type === "currency")?.value;
  const consultation = destinationConsultationHref(locale, d.slug);
  const tabs = [
    ["academics", t("تحصیل و آموزش", "Academics")],
    ["universities", t("دانشگاه‌ها", "Universities")],
    ["life", t("زندگی دانشجویی", "Student life")],
    ["planning", t("هزینه و برنامه‌ریزی", "Planning")],
    ["visa", t("پذیرش و ویزا", "Admission & visa")],
  ];
  useEffect(() => {
    if (!pageRef.current || !navigationRef.current) return;
    return trackDestinationSections(pageRef.current, navigationRef.current, setActive);
  }, [d.slug, locale]);

  return <SiteShell locale={locale}><main ref={pageRef} className={styles.page} data-destination={d.slug}>
    <div className={styles.topline}><div className={styles.container}>
      <nav aria-label={t("مسیر صفحه", "Breadcrumb")} className={styles.breadcrumb}><Link href={`/${locale}`}>{t("خانه", "Home")}</Link><span>/</span><Link href={`/${locale}/countries`}>{t("مقصدهای تحصیلی", "Study destinations")}</Link><span>/</span><span aria-current="page">{d.name[locale]}</span></nav>
    </div></div>

    <section className={styles.hero}><div className={`${styles.container} ${styles.heroGrid}`}>
      <div className={styles.heroCopy}>
        <h1>{t("آینده‌ات را در", "Find your future in")}<br /><span className={styles.countryName} style={{ backgroundImage: `url(/destinations/word-flags/${d.slug}.svg)` }}>{d.name[locale]}</span> {t("بساز", "")}</h1>
        <p className={styles.tagline}>{d.tagline[locale]}</p>
        <p className={styles.intro}>{t(`از شناخت دانشگاه‌ها تا آشنایی با زندگی در ${d.name.fa}؛ اینجا نقطه شروع مسیر تحصیلی شماست. با آگاهی انتخاب کنید و قدم بعدی را همراه ما بردارید.`, `From exploring universities to discovering life in ${d.name.en}, your study journey starts here. Get to know your options and take the next step with us.`)}</p>
        <div className={styles.actions}><Link className={styles.primary} href={consultation}>{t("شروع مسیر با مشاوره", "Plan my study journey")} <span aria-hidden="true">{t("←", "→")}</span></Link></div>
      </div>
      <DestinationCollage photos={collages.hero} locale={locale} layout="hero" />
    </div></section>

    <dl className={`${styles.container} ${styles.facts}`} aria-label={t("اطلاعات مقصد", "Destination facts")}>
      {[
        { label: t("زبان تحصیل", "Study language"), value: d.language[locale], icon: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></> },
        { label: t("واحد پول", "Currency"), value: <span className={styles.currencyValue} dir="ltr"><span>{currencySymbol}</span><span>{d.currency}</span></span>, icon: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5h-4.5a2 2 0 0 0 0 4H13a2 2 0 0 1 0 4H8.5M12 6v12" /></> },
        { label: t("شهرهای قابل بررسی", "Cities to explore"), value: d.cities[locale], icon: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> },
        { label: t("مسیرهای تحصیلی", "Study pathways"), value: t("کارشناسی · ارشد · دکتری", "Bachelor’s · Master’s · PhD"), icon: <><path d="m2 9 10-5 10 5-10 5L2 9ZM6 11v6c4 3 8 3 12 0v-6M22 9v7" /></> },
      ].map(({ label, value, icon }) => <div key={label} className={styles.fact}>
        <dt><svg className={styles.factIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icon}</svg><span>{label}</span></dt>
        <dd>{value}</dd>
      </div>)}
    </dl>

    <div className={styles.guide}>
    <div ref={navigationRef} className={styles.navigation}>
      <h2 id="destination-guide-title" className={`${styles.container} ${styles.navigationTitle}`}>{t(`۵ دلیل شگفت‌انگیز برای تحصیل در ${d.name.fa}`, `5 Incredible Reasons to Study in ${d.name.en}`)}</h2>
      <nav className={styles.container} aria-labelledby="destination-guide-title">{tabs.map(([id, title]) => <a key={id} className={active === id ? styles.selectedTab : ""} aria-current={active === id ? "location" : undefined} href={`#${id}`}>{title}</a>)}</nav>
    </div>

    <section id="academics" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial}`}>
      <DestinationCollage photos={collages.academics} locale={locale} layout="academics" className={styles.academicPhotos} />
      <div><h2>{t("جایی برای رشد ایده‌های شما", "Give your ideas room to grow")}</h2><p>{d.academics[locale]}</p><ul className={styles.checklist}><li>{t("انتخاب دانشگاه متناسب با هدف تحصیلی", "Choose a university that fits your goals")}</li><li>{t("بررسی زبان، پیش‌نیازها و محتوای دوره", "Review language, prerequisites and course content")}</li><li>{t("آماده‌سازی یک مسیر شخصی برای اپلای", "Build an application plan around your background")}</li></ul></div>
    </section>

    <section id="universities" data-destination-section className={`${styles.section} ${styles.universitySection}`}><div className={styles.container}>
      <div className={styles.sectionHeading}><div><h2>{t(`دانشگاه‌های ${d.name.fa} را بشناسید`, `Discover universities in ${d.name.en}`)}</h2></div></div>
      <div className={styles.universityGrid}>{universities.map((university) => <article className={styles.universityCard} key={university.slug}>
        <div className={styles.cardPhoto}><Image src={university.image} alt={university.name} fill sizes="(max-width: 760px) 100vw, 33vw" /></div>
        <div className={styles.cardBody}>
          <div className={styles.schoolIdentity} dir="ltr">
            <div className={styles.schoolLogo}><Image src={university.logo} alt="" width={48} height={48} /></div>
            <h3>{university.name}</h3>
            <p className={styles.location}>{university.location}</p>
          </div>
          <p>{university.summary[locale]}</p>
        </div>
      </article>)}</div>
    </div></section>

    <section id="life" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial} ${styles.life}`}>
      <div><h2>{t(`زندگی در ${d.name.fa}، تجربه‌ای تازه`, `Make a life in ${d.name.en}`)}</h2><p>{d.life[locale]}</p></div>
      <DestinationCollage photos={collages.life} locale={locale} layout="life" />
    </section>

    <section id="planning" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial} ${styles.planning}`}>
      <DestinationCollage photos={collages.planning} locale={locale} layout="planning" className={styles.planningPhoto} />
      <div>
        <h2>{t("هزینه‌ها را با تصویر کامل ببینید", "Plan for the whole experience")}</h2>
        <p>{d.planning.summary[locale]}</p>
        <ul className={`${styles.checklist} ${styles.detailList}`}>{([
          ["tuition", t("شهریه و آموزش", "Tuition & study")],
          ["living", t("بودجه زندگی", "Everyday budget")],
          ["arrival", t("هزینه‌های شروع", "Getting started")],
          ["funding", t("تأمین و مدیریت بودجه", "Funding & budgeting")],
        ] as const).map(([key, title]) => <li key={key}><div><strong>{title}</strong><p>{d.planning[key][locale]}</p></div></li>)}</ul>
        <p className={styles.planningNote}>{t("ارقام، برآورد منابع رسمی‌اند؛ مبلغ به‌روز را از دانشگاه و محل اقامت بگیرید.", "Figures are estimates from official guides; confirm current amounts with your institution and accommodation provider.")}</p>
      </div>
    </section>

    <section id="visa" data-destination-section className={`${styles.container} ${styles.section} ${styles.visa}`}>
      <DestinationCollage photos={collages.visa} locale={locale} layout="visa" className={styles.visaPhoto} />
      <div className={styles.visaCopy} dir={locale === "fa" ? "rtl" : "ltr"}>
        <h2>{t(`پذیرش و ویزای تحصیلی ${d.name.fa}`, `Admission & student visas for ${d.name.en}`)}</h2>
        <p>{d.visa.summary[locale]}</p>
        <ul className={`${styles.checklist} ${styles.detailList}`}>{([
          ["admission", t("پذیرش و تأیید ثبت‌نام", "Admission & enrolment")],
          ["documents", t("مدارک و آمادگی پرونده", "Documents & preparation")],
          ["process", t("مراحل ویزا و اقامت", "Visa & residence process")],
        ] as const).map(([key, title]) => <li key={key}><div><strong>{title}</strong><p>{d.visa[key][locale]}</p></div></li>)}</ul>
        <p className={styles.planningNote}>{t("مسیر و مدارک به تابعیت، دوره و شرایط شما بستگی دارد؛ پیش از اقدام، آخرین فهرست مرجع رسمی را بررسی کنید.", "The route and documents depend on your nationality, course and circumstances; check the official current checklist before applying.")}</p>
      </div>
    </section>
    </div>

    <section aria-labelledby="more-destinations-title" className={`${styles.container} ${styles.section} ${styles.more}`}>
      <h2 id="more-destinations-title">{t("مقصدهای دیگر را کشف کنید", "More Study Destinations to Explore")}</h2>
      <div>{destinations.filter((item) => item.slug !== d.slug).map((item) => <Link key={item.slug} href={`/${locale}/countries/${item.slug}`}>
        <Image src={`/destinations/word-flags/${item.slug}.svg`} alt="" width={28} height={22} />
        <span>{t(`تحصیل در ${item.name.fa}`, `Study in ${item.slug === "united-kingdom" || item.slug === "netherlands" ? "the " : ""}${item.name.en}`)}</span>
      </Link>)}</div>
    </section>
    <section id="destination-consultation" aria-labelledby="destination-consultation-title" className={`${styles.container} ${consultationStyles.section}`}>
      <header className={consultationStyles.heading}>
        <h2 id="destination-consultation-title">{t("مقصد را شناختید؛ حالا مسیر خودتان را بسازید", "You know the destination. Let’s plan your journey.")}</h2>
        <p>{t("شرایط و هدف خود را با ما در میان بگذارید تا قدم بعدی روشن‌تر شود.", "Share your background and goals with us to clarify your next step.")}</p>
      </header>
      <div className={consultationStyles.layout}>
        <div className={consultationStyles.photo}><Image src="/journey/profile-assessment.png" alt={t("مشاوره درباره مسیر تحصیلی", "Study pathway consultation")} fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
        <DestinationConsultation key={`${locale}-${d.slug}`} destination={d} locale={locale} />
      </div>
    </section>
  </main></SiteShell>;
}
