"use client";

import Image from "next/image";
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
        <h1>{t("آینده‌ات را در", "Find your future in")}<br /><span>{d.name[locale]}</span> {t("بساز", "")}</h1>
        <p className={styles.tagline}>{d.tagline[locale]}</p>
        <p className={styles.intro}>{t(`از شناخت دانشگاه‌ها تا آشنایی با زندگی در ${d.name.fa}؛ اینجا نقطه شروع مسیر تحصیلی شماست. با آگاهی انتخاب کنید و قدم بعدی را همراه ما بردارید.`, `From exploring universities to discovering life in ${d.name.en}, your study journey starts here. Get to know your options and take the next step with us.`)}</p>
        <div className={styles.actions}><Link className={styles.primary} href={consultation}>{t("شروع مسیر با مشاوره", "Plan my study journey")} <span aria-hidden="true">{t("←", "→")}</span></Link></div>
      </div>
      <figure className={styles.heroVisual}><Image src={d.image} alt={d.imageLabel[locale]} fill sizes="(max-width: 760px) 100vw, 50vw" preload /><div className={styles.imageShade} /><figcaption><Image src={`/destinations/flags/${d.slug}.svg`} alt="" width={42} height={30} /><div><strong>{d.name[locale]}</strong><span>{d.imageLabel[locale]}</span></div><span className={styles.compass} aria-hidden="true">↗</span></figcaption><span className={styles.photoLabel}>YOUR NEXT CHAPTER</span></figure>
    </div></section>

    <dl className={`${styles.container} ${styles.facts}`} aria-label={t("اطلاعات مقصد", "Destination facts")}>
      {[
        { label: t("زبان تحصیل", "Study language"), value: d.language[locale], icon: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></> },
        { label: t("واحد پول", "Currency"), value: d.currency, icon: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5h-4.5a2 2 0 0 0 0 4H13a2 2 0 0 1 0 4H8.5M12 6v12" /></> },
        { label: t("شهرهای قابل بررسی", "Cities to explore"), value: d.cities[locale], icon: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> },
        { label: t("مسیرهای تحصیلی", "Study pathways"), value: t("کارشناسی · ارشد · دکتری", "Bachelor’s · Master’s · PhD"), icon: <><path d="m2 9 10-5 10 5-10 5L2 9ZM6 11v6c4 3 8 3 12 0v-6M22 9v7" /></> },
      ].map(({ label, value, icon }) => <div key={label} className={styles.fact}>
        <dt><svg className={styles.factIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icon}</svg><span>{label}</span></dt>
        <dd>{value}</dd>
      </div>)}
    </dl>

    <div ref={navigationRef} className={styles.navigation}>
      <h2 id="destination-guide-title" className={`${styles.container} ${styles.navigationTitle}`}>{t(`۵ دلیل شگفت‌انگیز برای تحصیل در ${d.name.fa}`, `5 Incredible Reasons to Study in ${d.name.en}`)}</h2>
      <nav className={styles.container} aria-labelledby="destination-guide-title">{tabs.map(([id, title]) => <a key={id} className={active === id ? styles.selectedTab : ""} aria-current={active === id ? "location" : undefined} href={`#${id}`}>{title}</a>)}</nav>
    </div>

    <section id="academics" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial}`}>
      <div className={styles.academicPhotos}><Image className={styles.campusPhoto} src={universities[0]?.image || d.image} alt={universities[0]?.name || d.imageLabel[locale]} width={620} height={430} sizes="(max-width: 760px) 100vw, 45vw" /></div>
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

    <section id="life" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial} ${styles.life}`}><div><p className={styles.eyebrow}>{t("فراتر از کلاس درس", "BEYOND THE CLASSROOM")}</p><h2>{t(`زندگی در ${d.name.fa}، تجربه‌ای تازه`, `Make a life in ${d.name.en}`)}</h2><p>{d.life[locale]}</p><div className={styles.cityNote}><span aria-hidden="true">◎</span><div><strong>{t("از این شهرها شروع کنید", "Start with these cities")}</strong><p>{d.cities[locale]}</p></div></div></div><figure className={styles.lifePhoto}><Image src={universities[2]?.image || d.image} alt={universities[2]?.name || d.imageLabel[locale]} width={620} height={400} sizes="(max-width: 760px) 100vw, 45vw" /><figcaption>{universities[2]?.name || d.name[locale]}</figcaption></figure></section>

    <section id="planning" data-destination-section className={`${styles.container} ${styles.section} ${styles.planning}`}><p className={styles.eyebrow}>{t("با یک برنامه روشن شروع کنید", "START WITH A CLEAR PLAN")}</p><h2>{t("هزینه‌ها را با تصویر کامل ببینید", "Plan for the whole experience")}</h2><p>{t(`بودجه تحصیل در ${d.name.fa} به شهر، دانشگاه و سبک زندگی بستگی دارد. این سه بخش را با واحد ${d.currency} کنار هم قرار دهید.`, `Your study budget in ${d.name.en} depends on the city, institution and lifestyle. Plan these three areas in ${d.currency}.`)}</p><div className={styles.planGrid}>{[
      ["01", t("شهریه و هزینه‌های آموزشی", "Tuition & study costs"), t("شهریه دوره، منابع درسی و هزینه‌های اعلام‌شده دانشگاه را بررسی کنید.", "Check tuition, study materials and the institution’s listed fees.")],
      ["02", t("مسکن و زندگی روزمره", "Housing & everyday life"), t("اجاره، خوراک، بیمه و رفت‌وآمد را متناسب با شهر انتخابی برآورد کنید.", "Estimate rent, food, insurance and transport for your chosen city.")],
      ["03", t("آمادگی پیش از سفر", "Before you travel"), t("هزینه ترجمه مدارک، آزمون زبان و سفر را در برنامه خود بگنجانید.", "Include document translations, language tests and travel in your plan.")],
    ].map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section id="visa" data-destination-section className={`${styles.container} ${styles.section} ${styles.visa}`}><div><p className={styles.eyebrow}>{t("قدم بعدی، با اطلاعات معتبر", "YOUR NEXT STEP, WELL INFORMED")}</p><h2>{t(`آمادهٔ مسیر تحصیل در ${d.name.fa} شوید`, `Prepare for your journey to ${d.name.en}`)}</h2><p>{t("ابتدا شرایط پذیرش دانشگاه را بررسی کنید؛ سپس راهنمای رسمی ویزا و اقامت متناسب با تابعیت و وضعیت خود را بخوانید. الزامات و هزینه‌ها ممکن است تغییر کنند.", "Start with your university’s admission requirements, then check official visa and residence guidance for your nationality and circumstances. Requirements and fees can change.")}</p></div><ol className={styles.steps}>{[t("هدف، رشته و مقطع را مشخص کنید", "Define your subject and study level"), t("شرایط دانشگاه و مدارک را بررسی کنید", "Check entry requirements and documents"), t("زمان‌بندی و بودجه خود را آماده کنید", "Prepare your timeline and budget"), t("الزامات ویزا را از مرجع رسمی بخوانید", "Read official visa guidance")].map((item, i) => <li key={item}><span>{(i + 1).toLocaleString(locale)}</span>{item}</li>)}</ol></section>

    <section className={`${styles.container} ${styles.cta}`}><div><p className={styles.eyebrow}>JAHAN ACADEMY</p><h2>{t("مقصد را شناختید؛ حالا مسیر خودتان را بسازید", "You know the destination. Let’s plan your journey.")}</h2><p>{t("شرایط و هدف خود را با ما در میان بگذارید تا قدم بعدی روشن‌تر شود.", "Share your background and goals with us to clarify your next step.")}</p></div><Link href={consultation}>{t("درخواست مشاوره", "Request a consultation")} <span aria-hidden="true">{t("←", "→")}</span></Link></section>

    <section className={`${styles.container} ${styles.section} ${styles.more}`}><h2>{t("مقصدهای دیگر را کشف کنید", "Explore more destinations")}</h2><div>{destinations.filter((item) => item.slug !== d.slug).map((item) => <Link key={item.slug} href={`/${locale}/countries/${item.slug}`}><Image src={`/destinations/flags/${item.slug}.svg`} alt="" width={26} height={20} />{item.name[locale]}<span aria-hidden="true">{t("←", "→")}</span></Link>)}</div></section>
  </main></SiteShell>;
}
