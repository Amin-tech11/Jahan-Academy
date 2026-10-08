"use client";
import SiteSelect from "./site-select";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { destinations, destinationConsultationHref, type Destination } from "@/lib/destination-content";
import { homeUniversities } from "@/lib/home-universities";
import type { Locale } from "@/lib/site-content";
import styles from "./destination-page.module.css";

export function DestinationPage({ destination: d, locale }: { destination: Destination; locale: Locale }) {
  const router = useRouter();
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const [active, setActive] = useState("academics");
  const [query, setQuery] = useState("");
  const universities = homeUniversities.filter((university) => university.country === d.slug);
  const visibleUniversities = universities.filter((university) => `${university.name} ${university.location} ${university.summary[locale]}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const consultation = destinationConsultationHref(locale, d.slug);
  const tabs = [
    ["academics", t("تحصیل و آموزش", "Academics")],
    ["universities", t("دانشگاه‌ها", "Universities")],
    ["life", t("زندگی دانشجویی", "Student life")],
    ["planning", t("هزینه و برنامه‌ریزی", "Planning")],
    ["visa", t("پذیرش و ویزا", "Admission & visa")],
  ];
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.isIntersecting);
      if (entry) setActive(entry.target.id);
    }, { rootMargin: "-18% 0px -60% 0px" });
    document.querySelectorAll("[data-destination-section]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [d.slug]);

  return <SiteShell locale={locale}><main className={styles.page}>
    <div className={styles.topline}><div className={styles.container}>
      <nav aria-label={t("مسیر صفحه", "Breadcrumb")} className={styles.breadcrumb}><Link href={`/${locale}`}>{t("خانه", "Home")}</Link><span>/</span><Link href={`/${locale}/countries`}>{t("مقصدهای تحصیلی", "Study destinations")}</Link><span>/</span><span aria-current="page">{d.name[locale]}</span></nav>
      <label className={styles.selector}>{t("مقصد شما", "Your destination")}<SiteSelect aria-label={t("انتخاب کشور مقصد", "Choose a destination")} value={d.slug} onChange={(event) => router.push(`/${locale}/countries/${event.target.value}`)}>{destinations.map((item) => <option key={item.slug} value={item.slug}>{item.name[locale]}</option>)}</SiteSelect></label>
    </div></div>

    <section className={styles.hero}><div className={`${styles.container} ${styles.heroGrid}`}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span className={styles.dot} />{t("یک مقصد تازه، یک شروع تازه", "A NEW DESTINATION. A NEW BEGINNING.")}</p>
        <h1>{t("آینده‌ات را در", "Find your future in")}<br /><span>{d.name[locale]}</span> {t("بساز", "")}</h1>
        <p className={styles.tagline}>{d.tagline[locale]}</p>
        <p className={styles.intro}>{t(`از شناخت دانشگاه‌ها تا آشنایی با زندگی در ${d.name.fa}؛ اینجا نقطه شروع مسیر تحصیلی شماست. با آگاهی انتخاب کنید و قدم بعدی را همراه ما بردارید.`, `From exploring universities to discovering life in ${d.name.en}, your study journey starts here. Get to know your options and take the next step with us.`)}</p>
        <div className={styles.actions}><Link className={styles.primary} href={consultation}>{t("شروع مسیر با مشاوره", "Plan my study journey")} <span aria-hidden="true">{t("←", "→")}</span></Link><a className={styles.secondary} href="#academics">{t("کشف این مقصد", "Explore this destination")} <span aria-hidden="true">↓</span></a></div>
        <div className={styles.heroNote}><span aria-hidden="true">✓</span>{t("از اولین سؤال تا انتخاب مسیر، همراه شما هستیم", "Thoughtful guidance, from your first question onward")}</div>
      </div>
      <figure className={styles.heroVisual}><Image src={d.image} alt={d.imageLabel[locale]} fill sizes="(max-width: 760px) 100vw, 50vw" preload /><div className={styles.imageShade} /><figcaption><Image src={`/destinations/flags/${d.slug}.svg`} alt="" width={42} height={30} /><div><strong>{d.name[locale]}</strong><span>{d.imageLabel[locale]}</span></div><span className={styles.compass} aria-hidden="true">↗</span></figcaption><span className={styles.photoLabel}>YOUR NEXT CHAPTER</span></figure>
    </div></section>

    <div className={`${styles.container} ${styles.facts}`}>
      {[[t("زبان تحصیل", "Study language"), d.language[locale]], [t("واحد پول", "Currency"), d.currency], [t("شهرهای قابل بررسی", "Cities to explore"), d.cities[locale]], [t("مسیرهای تحصیلی", "Study pathways"), t("کارشناسی · ارشد · دکتری", "Bachelor’s · Master’s · PhD")]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>

    <div className={styles.navigation}><nav className={styles.container} aria-label={t("بخش‌های راهنمای مقصد", "Destination guide sections")}>{tabs.map(([id, title], index) => <a key={id} className={active === id ? styles.selectedTab : ""} aria-current={active === id ? "location" : undefined} href={`#${id}`} onClick={() => setActive(id)}><span aria-hidden="true">0{index + 1}</span>{title}</a>)}</nav></div>

    <section id="academics" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial}`}>
      <div className={styles.academicPhotos}><Image className={styles.campusPhoto} src={universities[0]?.image || d.image} alt={universities[0]?.name || d.imageLabel[locale]} width={620} height={430} sizes="(max-width: 760px) 100vw, 45vw" /><div className={styles.logoStrip}>{universities.map((university) => <Image key={university.slug} src={university.logo} alt={university.name} width={58} height={58} />)}<span>{t("نگاهی به دانشگاه‌های این مقصد", "Meet your next campus")}</span></div></div>
      <div><p className={styles.eyebrow}>{t("یادگیری، فراتر از مرزها", "EDUCATION BEYOND BORDERS")}</p><h2>{t("جایی برای رشد ایده‌های شما", "Give your ideas room to grow")}</h2><p>{d.academics[locale]}</p><ul className={styles.checklist}><li>{t("انتخاب دانشگاه متناسب با هدف تحصیلی", "Choose a university that fits your goals")}</li><li>{t("بررسی زبان، پیش‌نیازها و محتوای دوره", "Review language, prerequisites and course content")}</li><li>{t("آماده‌سازی یک مسیر شخصی برای اپلای", "Build an application plan around your background")}</li></ul><a className={styles.textLink} href="#universities">{t(`آشنایی با دانشگاه‌های ${d.name.fa}`, `Explore universities in ${d.name.en}`)} <span aria-hidden="true">{t("←", "→")}</span></a></div>
    </section>

    <section id="universities" data-destination-section className={`${styles.section} ${styles.universitySection}`}><div className={styles.container}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t("دانشگاه بعدی شما کجاست؟", "WHERE WILL YOU GO NEXT?")}</p><h2>{t(`دانشگاه‌های ${d.name.fa} را بشناسید`, `Discover universities in ${d.name.en}`)}</h2></div><label className={styles.search}><span>{t("جست‌وجو در این دانشگاه‌ها", "Search these universities")}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("نام دانشگاه یا شهر…", "University or city…")} /></label></div>
      <p className={styles.resultCount} role="status">{t(`${visibleUniversities.length.toLocaleString("fa")} دانشگاه برای آشنایی اولیه`, `${visibleUniversities.length} universities to explore`)}</p>
      <div className={styles.universityGrid}>{visibleUniversities.map((university) => <article className={styles.universityCard} key={university.slug}><div className={styles.cardPhoto}><Image src={university.image} alt={university.name} fill sizes="(max-width: 760px) 100vw, 33vw" /><span>{d.name[locale]}</span></div><div className={styles.cardBody}><div className={styles.schoolLogo}><Image src={university.logo} alt="" width={48} height={48} /></div><p className={styles.location} dir="ltr">{university.location}</p><h3 dir="ltr">{university.name}</h3><p>{university.summary[locale]}</p><Link href={destinationConsultationHref(locale, d.slug, university.slug)}>{t("مشاوره درباره این دانشگاه", "Discuss this university")} <span aria-hidden="true">{t("←", "→")}</span></Link></div></article>)}</div>
      {visibleUniversities.length === 0 && <div className={styles.empty}><h3>{t("دانشگاهی با این عبارت پیدا نشد", "No matching university")}</h3><p>{t("نام دیگری را امتحان کنید یا جست‌وجو را پاک کنید.", "Try another name or clear your search.")}</p><button onClick={() => setQuery("")}>{t("نمایش همه دانشگاه‌ها", "Show all universities")}</button></div>}
    </div></section>

    <section id="life" data-destination-section className={`${styles.container} ${styles.section} ${styles.editorial} ${styles.life}`}><div><p className={styles.eyebrow}>{t("فراتر از کلاس درس", "BEYOND THE CLASSROOM")}</p><h2>{t(`زندگی در ${d.name.fa}، تجربه‌ای تازه`, `Make a life in ${d.name.en}`)}</h2><p>{d.life[locale]}</p><div className={styles.cityNote}><span aria-hidden="true">◎</span><div><strong>{t("از این شهرها شروع کنید", "Start with these cities")}</strong><p>{d.cities[locale]}</p></div></div></div><figure className={styles.lifePhoto}><Image src={universities[2]?.image || d.image} alt={universities[2]?.name || d.imageLabel[locale]} width={620} height={400} sizes="(max-width: 760px) 100vw, 45vw" /><figcaption>{universities[2]?.name || d.name[locale]}</figcaption></figure></section>

    <section id="planning" data-destination-section className={`${styles.container} ${styles.section} ${styles.planning}`}><p className={styles.eyebrow}>{t("با یک برنامه روشن شروع کنید", "START WITH A CLEAR PLAN")}</p><h2>{t("هزینه‌ها را با تصویر کامل ببینید", "Plan for the whole experience")}</h2><p>{t(`بودجه تحصیل در ${d.name.fa} به شهر، دانشگاه و سبک زندگی بستگی دارد. این سه بخش را با واحد ${d.currency} کنار هم قرار دهید.`, `Your study budget in ${d.name.en} depends on the city, institution and lifestyle. Plan these three areas in ${d.currency}.`)}</p><div className={styles.planGrid}>{[
      ["01", t("شهریه و هزینه‌های آموزشی", "Tuition & study costs"), t("شهریه دوره، منابع درسی و هزینه‌های اعلام‌شده دانشگاه را بررسی کنید.", "Check tuition, study materials and the institution’s listed fees.")],
      ["02", t("مسکن و زندگی روزمره", "Housing & everyday life"), t("اجاره، خوراک، بیمه و رفت‌وآمد را متناسب با شهر انتخابی برآورد کنید.", "Estimate rent, food, insurance and transport for your chosen city.")],
      ["03", t("آمادگی پیش از سفر", "Before you travel"), t("هزینه ترجمه مدارک، آزمون زبان و سفر را در برنامه خود بگنجانید.", "Include document translations, language tests and travel in your plan.")],
    ].map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>

    <section id="visa" data-destination-section className={`${styles.container} ${styles.section} ${styles.visa}`}><div><p className={styles.eyebrow}>{t("قدم بعدی، با اطلاعات معتبر", "YOUR NEXT STEP, WELL INFORMED")}</p><h2>{t(`آمادهٔ مسیر تحصیل در ${d.name.fa} شوید`, `Prepare for your journey to ${d.name.en}`)}</h2><p>{t("ابتدا شرایط پذیرش دانشگاه را بررسی کنید؛ سپس راهنمای رسمی ویزا و اقامت متناسب با تابعیت و وضعیت خود را بخوانید. الزامات و هزینه‌ها ممکن است تغییر کنند.", "Start with your university’s admission requirements, then check official visa and residence guidance for your nationality and circumstances. Requirements and fees can change.")}</p><a href={d.source} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{t("راهنمای رسمی مقصد", "Official destination guide")} · {d.sourceName} ↗</a></div><ol className={styles.steps}>{[t("هدف، رشته و مقطع را مشخص کنید", "Define your subject and study level"), t("شرایط دانشگاه و مدارک را بررسی کنید", "Check entry requirements and documents"), t("زمان‌بندی و بودجه خود را آماده کنید", "Prepare your timeline and budget"), t("الزامات ویزا را از مرجع رسمی بخوانید", "Read official visa guidance")].map((item, i) => <li key={item}><span>{(i + 1).toLocaleString(locale)}</span>{item}</li>)}</ol></section>

    <section className={`${styles.container} ${styles.cta}`}><div><p className={styles.eyebrow}>JAHAN ACADEMY</p><h2>{t("مقصد را شناختید؛ حالا مسیر خودتان را بسازید", "You know the destination. Let’s plan your journey.")}</h2><p>{t("شرایط و هدف خود را با ما در میان بگذارید تا قدم بعدی روشن‌تر شود.", "Share your background and goals with us to clarify your next step.")}</p></div><Link href={consultation}>{t("درخواست مشاوره", "Request a consultation")} <span aria-hidden="true">{t("←", "→")}</span></Link></section>

    <section className={`${styles.container} ${styles.section} ${styles.more}`}><p className={styles.eyebrow}>{t("جهان، پر از مسیرهای تازه است", "MORE PLACES. MORE POSSIBILITIES.")}</p><h2>{t("مقصدهای دیگر را کشف کنید", "Explore more destinations")}</h2><div>{destinations.filter((item) => item.slug !== d.slug).map((item) => <Link key={item.slug} href={`/${locale}/countries/${item.slug}`}><Image src={`/destinations/flags/${item.slug}.svg`} alt="" width={26} height={20} />{item.name[locale]}<span aria-hidden="true">{t("←", "→")}</span></Link>)}</div></section>
  </main></SiteShell>;
}
