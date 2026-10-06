import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { DestinationsExplorer } from "@/components/destinations-explorer";
import { DestinationsTabs, FeaturedDestinationsLink } from "@/components/destinations-overview-interactive";
import { destinationCount, destinationOverviews, regionLabels } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

const copy = {
  fa: {
    home: "صفحهٔ اصلی", section: "مقصدهای تحصیلی", eyebrow: "جهان، کلاس درس شماست",
    title: "آینده‌ات را کجای جهان می‌بینی؟",
    intro: "کشورها را بشناسید، اولویت‌هایتان را روشن کنید و قدم بعدی مسیر تحصیلی خود را آگاهانه انتخاب کنید.",
    overview: "دربارهٔ مقصدهای تحصیلی", overviewText: "هر مقصد، دنیایی از تجربه‌های تازه است. در این راهنما می‌توانید کشورها را کنار هدف تحصیلی، امکانات و سبک زندگی دلخواهتان بررسی کنید.",
    factsTitle: "نگاهی سریع", number: "مقصدهای معرفی‌شده", regions: "منطقه‌های قابل بررسی", language: "زبان راهنما",
    featuredTitle: "مقصدهای پرطرفدار", featuredLink: "دیدن همهٔ مقصدها",
    guide: "راهنمای انتخاب مقصد", guideTitle: "انتخابی فراتر از نام یک کشور", guideText: "مقصد مناسب، جایی است که با هدف تحصیلی، امکانات و سبک زندگی شما هماهنگ باشد.",
    criteria: [
      { title: "هدف و مسیر تحصیلی", text: "رشتهٔ موردعلاقه، مقطع بعدی و زبان تحصیل را مشخص کنید؛ سپس گزینه‌ها را با پیشینهٔ خود بسنجید." },
      { title: "بودجه و زندگی روزمره", text: "شهریه، مسکن، رفت‌وآمد و هزینه‌های اولیه را کنار هم ببینید؛ بودجه فقط هزینهٔ دانشگاه نیست." },
      { title: "زبان و سبک زندگی", text: "آب‌وهوا، زبان روزمره، فاصله از خانواده و فضای فرهنگی شهر را در تصمیم خود وارد کنید." },
    ],
    collection: "فهرست مقصدها", collectionTitle: "کشور مناسب خود را پیدا کنید", collectionText: "کشورها را بر اساس منطقه مرور کنید یا نام مقصد موردنظرتان را جست‌وجو کنید.",
    journey: "مراحل شروع مسیر", journeyTitle: "از شناخت مقصد تا شروع مسیر", journeyText: "لازم نیست از همین امروز پاسخ همهٔ پرسش‌ها را بدانید. از یک تصویر روشن از شرایط خود شروع کنید.",
    steps: [
      ["اولویت‌هایتان را بنویسید", "هدف تحصیلی، زبان، بودجه و زمان مدنظر را مشخص کنید."],
      ["چند مقصد را بشناسید", "معرفی کشورها را بخوانید و گزینه‌های موردعلاقه را کوتاه‌تر کنید."],
      ["شرایطتان را بررسی کنید", "با راهنمایی مشاور، گزینه‌ها را با سوابق و نیازهای خود بسنجید."],
      ["برای قدم بعد آماده شوید", "فهرست مدارک و زمان‌بندی اقدام را متناسب با مسیر خود تنظیم کنید."],
    ],
    faqEyebrow: "پیش از انتخاب", faqTitle: "پرسش‌هایی که شاید برای شما هم پیش آمده باشد", faqs: [
      ["از کجا بفهمم کدام کشور برای من مناسب‌تر است؟", "از هدف تحصیلی، سوابق، سطح زبان، بودجه و اولویت‌های زندگی شروع کنید. معرفی کشورها به شناخت اولیه کمک می‌کند؛ برای انتخاب نهایی، شرایط شخصی و الزامات دانشگاه مقصد باید کنار هم بررسی شوند."],
      ["آیا هزینهٔ تحصیل در یک کشور برای همه یکسان است؟", "خیر. دانشگاه، مقطع، رشته، شهر محل زندگی و نوع اقامت می‌توانند هزینه‌ها را تغییر دهند. برای برآورد واقعی، شهریه و هزینه‌های زندگی را جداگانه و بر اساس اطلاعات به‌روز همان مؤسسه بررسی کنید."],
      ["آیا زبان رایج کشور همان زبان تدریس دانشگاه است؟", "لزوماً خیر. زبان تدریس به دانشگاه و دوره بستگی دارد. پیش از تصمیم‌گیری، زبان دوره، نوع مدرک زبان موردنیاز و نیازهای زبان روزمره را جداگانه بررسی کنید."],
      ["برای جلسهٔ مشاوره چه اطلاعاتی آماده کنم؟", "آخرین مدرک و رشتهٔ تحصیلی، معدل، وضعیت زبان، بودجهٔ تقریبی و زمان مدنظر را آماده کنید. اگر هنوز مقصد مشخصی ندارید، می‌توانید از بررسی همین اطلاعات شروع کنید."],
    ],
    ctaEyebrow: "قدم بعدی، یک گفت‌وگوست", ctaTitle: "هنوز مقصدتان را انتخاب نکرده‌اید؟", ctaText: "با هم شرایط و اولویت‌های شما را مرور می‌کنیم تا انتخاب بعدی‌تان روشن‌تر باشد.", ctaButton: "شروع ارزیابی شرایط", top: "بازگشت به بالای صفحه",
  },
  en: {
    home: "Home", section: "Study destinations", eyebrow: "THE WORLD IS YOUR CLASSROOM",
    title: "Where in the world do you see your future?",
    intro: "Get to know the countries, define your priorities and make an informed choice about your next academic step.",
    overview: "About study destinations", overviewText: "Every destination opens up new experiences. Use this guide to consider countries alongside your academic goals, resources and preferred way of life.",
    factsTitle: "At a glance", number: "Destinations featured", regions: "Regions to explore", language: "Guide language",
    featuredTitle: "Popular destinations", featuredLink: "View all destinations",
    guide: "A GUIDE TO YOUR NEXT CHAPTER", guideTitle: "More than choosing a country", guideText: "The right destination should fit your academic goals, resources and way of life.",
    criteria: [
      { title: "Your academic direction", text: "Define your interests, next qualification and study language, then consider how each option fits your background." },
      { title: "Budget and everyday life", text: "Look at tuition, accommodation, transport and initial expenses together. Your budget goes beyond university fees." },
      { title: "Language and lifestyle", text: "Consider the climate, everyday language, distance from family and cultural setting of your future city." },
    ],
    collection: "DESTINATION DIRECTORY", collectionTitle: "Find a place that fits your plans", collectionText: "Browse countries by region or search for the destination on your mind.",
    journey: "PLAN YOUR NEXT STEP", journeyTitle: "From curiosity to a clear direction", journeyText: "You do not need all the answers today. Start with a clear picture of your own situation.",
    steps: [
      ["Define your priorities", "Outline your academic goals, language, budget and preferred timeline."],
      ["Explore destinations", "Read the country introductions and narrow down the places that interest you."],
      ["Review your situation", "Discuss how the options fit your background and needs with a consultant."],
      ["Prepare your next step", "Plan the documents and timeline that suit your chosen path."],
    ],
    faqEyebrow: "BEFORE YOU CHOOSE", faqTitle: "A little clarity for the questions ahead", faqs: [
      ["How can I find the right country for me?", "Begin with your goals, academic background, language, budget and lifestyle priorities. Country guides offer an introduction; a final choice needs to account for your individual situation and the requirements of your intended university."],
      ["Does everyone pay the same study costs in a country?", "No. Costs vary by institution, qualification, subject, city and accommodation. Estimate tuition and living costs separately using current information from the relevant institution."],
      ["Is the country's common language also the teaching language?", "Not necessarily. The teaching language depends on the institution and course. Check course language, required language evidence and everyday language needs separately."],
      ["What should I prepare for a consultation?", "Bring your latest qualification, subject, grades, language background, approximate budget and preferred timeline. You can start with these details even if you have not chosen a destination."],
    ],
    ctaEyebrow: "YOUR NEXT STEP IS A CONVERSATION", ctaTitle: "Still looking for your destination?", ctaText: "Let us review your situation and priorities together, so your next choice feels clearer.", ctaButton: "Start your assessment", top: "Back to top",
  },
};

export function DestinationsOverview({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const fa = locale === "fa";
  const consultation = `/${locale}/consultation?source=destinations-overview`;
  const regionsCount = new Set(destinationOverviews.map((item) => item.region)).size;
  const overviewPanel = <Fragment key="overview">
    <p className={styles.eyebrow}>{c.eyebrow}</p>
    <h2>{c.overview}</h2>
    <p className={styles.prose}>{c.overviewText}</p>
    <div className={styles.overviewHighlights}>{c.criteria.map((item, index) => <article key={item.title}>
      <span className={styles.highlightNumber}>{`0${index + 1}`}</span><h3>{item.title}</h3><p>{item.text}</p>
    </article>)}</div>
  </Fragment>;
  const guidePanel = <Fragment key="guide">
    <p className={styles.eyebrow}>{c.guide}</p><h2>{c.guideTitle}</h2><p className={styles.prose}>{c.guideText}</p>
    <ol className={styles.steps}>{c.steps.map(([title, text], index) => <li key={title}><span>{destinationCount(index + 1, locale)}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
  </Fragment>;
  const faqPanel = <Fragment key="questions">
    <p className={styles.eyebrow}>{c.faqEyebrow}</p><h2>{c.faqTitle}</h2>
    <div className={styles.faqList}>{c.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
  </Fragment>;
  return <SiteShell locale={locale}><main className={styles.page} id="destinations-top">
    <div className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label={fa ? "مسیر صفحه" : "Breadcrumb"}>
        <Link href={`/${locale}`}>{c.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{c.section}</span>
      </nav>
      <header className={styles.identity} dir={fa ? "rtl" : "ltr"}>
        <span className={styles.identityMark} aria-hidden="true"><svg width="31" height="31" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="1.5"/><path d="M3 12h18M5.5 6.5h13M5.5 17.5h13" stroke="currentColor" strokeWidth="1.3"/></svg></span>
        <div className={styles.identityText}><p className={styles.identityEyebrow}>{c.eyebrow}</p><h1>{c.title}</h1><p className={styles.identityIntro}>{c.intro}</p></div>
      </header>
      <section className={styles.hero} aria-label={fa ? "نقشهٔ جهان، مقصدهای تحصیلی" : "World map, study destinations"}>
        <Image className={styles.heroArtwork} src="/destinations/world-map-hero-wide.png" alt={fa ? "نقشهٔ برجستهٔ جهان با نورهای طلایی" : "A raised world map illuminated in warm gold"} fill sizes="(max-width: 760px) 100vw, 1160px" preload />
        <div className={styles.heroShade} aria-hidden="true" />
        <p className={styles.heroBrand} lang="en">JAHAN ACADEMY</p>
      </section>
      <div className={styles.contentGrid}>
        <DestinationsTabs locale={locale} panels={[
          overviewPanel,
          <Fragment key="destinations"><p className={styles.eyebrow}>{c.collection}</p><h2>{c.collectionTitle}</h2><p className={styles.prose}>{c.collectionText}</p><DestinationsExplorer locale={locale} /></Fragment>,
          guidePanel,
          faqPanel,
        ]} />
        <aside className={styles.sidebar} aria-label={fa ? "اطلاعات مقصدهای تحصیلی" : "Study destination information"}>
          <section className={styles.factCard}><h2>{c.factsTitle}</h2><dl>
            <div><dt>{c.number}</dt><dd>{destinationCount(destinationOverviews.length, locale)}</dd></div>
            <div><dt>{c.regions}</dt><dd>{destinationCount(regionsCount, locale)}</dd></div>
            <div><dt>{c.language}</dt><dd>{fa ? "فارسی و انگلیسی" : "English and Persian"}</dd></div>
          </dl></section>
          <section className={styles.featuredCard}><h2>{c.featuredTitle}</h2><ul>{destinationOverviews.slice(0, 4).map((item) => <li key={item.slug}>
            <Link href={`/${locale}/countries/${item.slug}`}><Image src={`/destinations/flags/${item.slug}.svg`} alt="" width={30} height={30} /><span>{item.name[locale]}</span><b aria-hidden="true">{fa ? "↖" : "↗"}</b></Link>
          </li>)}</ul><FeaturedDestinationsLink locale={locale}>{c.featuredLink}</FeaturedDestinationsLink></section>
        </aside>
      </div>
      <section className={styles.cta} aria-labelledby="cta-title"><div><p className={styles.ctaEyebrow}>{c.ctaEyebrow}</p><h2 id="cta-title">{c.ctaTitle}</h2><p>{c.ctaText}</p></div><Link href={consultation}>{c.ctaButton}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link></section>
      <div className={styles.bottom}><span lang="en">JAHAN ACADEMY · STUDY, GROW, BELONG</span><a href="#destinations-top">{c.top} ↑</a></div>
    </div>
  </main></SiteShell>;
}
