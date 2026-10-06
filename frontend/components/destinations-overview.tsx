import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { DestinationsExplorer } from "@/components/destinations-explorer";
import { destinationCount, destinationOverviews } from "@/lib/destinations-overview";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

const copy = {
  fa: {
    destinations: "مقصدهای تحصیلی", eyebrow: "جهان، کلاس درس شماست",
    title: "آینده‌ات را", accent: "کجای جهان می‌بینی؟",
    intro: "هر مقصد، دنیایی از تجربه‌های تازه است. کشورها را بشناسید، اولویت‌هایتان را روشن کنید و اولین قدم را برای مسیر تحصیلی خود بردارید.",
    explore: "کشف مقصدها", consultation: "راهنمایی برای انتخاب مقصد",
    guide: "راهنمای انتخاب مقصد", guideTitle: "انتخابی فراتر از نام یک کشور", guideText: "مقصد مناسب، جایی است که با هدف تحصیلی، امکانات و سبک زندگی شما هماهنگ باشد.",
    criteria: [
      { icon: "study", title: "هدف و مسیر تحصیلی", text: "رشتهٔ موردعلاقه، مقطع بعدی و زبان تحصیل را مشخص کنید؛ سپس گزینه‌ها را با پیشینهٔ خود بسنجید." },
      { icon: "budget", title: "بودجه و زندگی روزمره", text: "شهریه، مسکن، رفت‌وآمد و هزینه‌های اولیه را کنار هم ببینید؛ بودجه فقط هزینهٔ دانشگاه نیست." },
      { icon: "world", title: "زبان و سبک زندگی", text: "آب‌وهوا، زبان روزمره، فاصله از خانواده و فضای فرهنگی شهر را در تصمیم خود وارد کنید." },
    ],
    collection: "جهان را از اینجا کشف کنید", collectionTitle: "مقصد بعدی شما کجاست؟", collectionText: "از اروپا تا آن سوی اقیانوس؛ آشنایی اولیه با کشورهایی برای ادامهٔ مسیر تحصیلی شما.",
    journey: "قدم‌به‌قدم، با جهان آکادمی", journeyTitle: "از شناخت مقصد تا شروع مسیر", journeyText: "لازم نیست از همین امروز پاسخ همهٔ پرسش‌ها را بدانید. از یک تصویر روشن از شرایط خود شروع کنید.",
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
    destinations: "Study destinations", eyebrow: "THE WORLD IS YOUR CLASSROOM",
    title: "Where in the world", accent: "do you see your future?",
    intro: "Every destination opens up new experiences. Get to know the countries, define your priorities and take the first step on your academic journey.",
    explore: "Explore destinations", consultation: "Help me choose",
    guide: "A GUIDE TO YOUR NEXT CHAPTER", guideTitle: "More than choosing a country", guideText: "The right destination should fit your academic goals, resources and way of life.",
    criteria: [
      { icon: "study", title: "Your academic direction", text: "Define your interests, next qualification and study language, then consider how each option fits your background." },
      { icon: "budget", title: "Budget and everyday life", text: "Look at tuition, accommodation, transport and initial expenses together. Your budget goes beyond university fees." },
      { icon: "world", title: "Language and lifestyle", text: "Consider the climate, everyday language, distance from family and cultural setting of your future city." },
    ],
    collection: "YOUR NEXT CHAPTER STARTS HERE", collectionTitle: "Find your place in the world", collectionText: "From Europe to across the oceans, get a first look at countries for your next academic chapter.",
    journey: "WITH YOU, STEP BY STEP", journeyTitle: "From curiosity to a clear direction", journeyText: "You do not need all the answers today. Start with a clear picture of your own situation.",
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

function GuideIcon({ icon }: { icon: string }) {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {icon === "study" ? <><path d="m2 8 10-5 10 5-10 5L2 8Z" /><path d="M6 10v7c4 3 8 3 12 0v-7M22 8v8" /></> : icon === "budget" ? <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M16 14h5M7 5V3h10" /></> : <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>}
  </svg>;
}

export function DestinationsOverview({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const fa = locale === "fa";
  const consultation = `/${locale}/consultation?source=destinations-overview`;
  return <SiteShell locale={locale}><main className={styles.page} id="destinations-top">
    <section className={styles.hero} aria-label={fa ? "جهان آکادمی" : "Jahan Academy"}>
      <Image className={styles.heroArtwork} src="/destinations/world-map-hero-wide.png" alt={fa ? "نقشهٔ برجستهٔ جهان با نورهای طلایی" : "A raised world map illuminated in warm gold"} fill sizes="100vw" preload />
      <div className={styles.heroShade} aria-hidden="true" />
      <p className={styles.heroBrand} lang="en">JAHAN ACADEMY</p>
    </section>
    <section className={styles.introSection} aria-labelledby="destination-title">
      <div className={`${styles.wrap} ${styles.introCopy}`}>
        <p className={styles.heroEyebrow}><span />{c.eyebrow}</p>
        <h1 id="destination-title">{c.title}<br /><em>{c.accent}</em></h1>
        <p className={styles.heroIntro}>{c.intro}</p>
        <div className={styles.heroActions}><a className={styles.primary} href="#explore">{c.explore}<span aria-hidden="true">↓</span></a><Link className={styles.secondary} href={consultation}>{c.consultation}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link></div>
        <div className={styles.heroFootnote}><span className={styles.miniFlags}>{["canada", "germany", "italy"].map((slug) => <Image key={slug} src={`/destinations/flags/${slug}.svg`} width={30} height={30} alt="" />)}</span><span>{fa ? "۱۰ مقصد، فرصت‌های تازه برای فردای شما" : "10 destinations. A world of possibilities."}</span></div>
      </div>
    </section>
    <nav className={`${styles.wrap} ${styles.quickNav}`} aria-label={fa ? "بخش‌های راهنما" : "On this page"}>
      <a href="#explore"><span>{destinationCount(destinationOverviews.length, locale)}</span>{c.destinations}</a><a href="#choose"><GuideIcon icon="world" />{c.guide}</a><a href="#journey"><GuideIcon icon="study" />{fa ? "مراحل شروع مسیر" : "Plan your journey"}</a><a href="#questions"><span>?</span>{fa ? "پرسش‌های پرتکرار" : "Common questions"}</a>
    </nav>
    <section className={`${styles.wrap} ${styles.section}`} id="choose" aria-labelledby="choose-title">
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{c.guide}</p><h2 id="choose-title">{c.guideTitle}</h2></div><p>{c.guideText}</p></div>
      <div className={styles.criteria}>{c.criteria.map((item, index) => <article key={item.icon}><div className={styles.criteriaTop}><span className={styles.iconBox}><GuideIcon icon={item.icon} /></span><span>{`0${index + 1}`}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>
    <section className={styles.exploreSection} id="explore" aria-labelledby="explore-title"><div className={styles.wrap}>
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{c.collection}</p><h2 id="explore-title">{c.collectionTitle}</h2></div><p>{c.collectionText}</p></div>
      <DestinationsExplorer locale={locale} />
    </div></section>
    <section className={`${styles.wrap} ${styles.section} ${styles.journey}`} id="journey" aria-labelledby="journey-title">
      <div className={styles.journeyIntro}><p className={styles.eyebrow}>{c.journey}</p><h2 id="journey-title">{c.journeyTitle}</h2><p>{c.journeyText}</p><Link className={styles.inlineLink} href={consultation}>{c.ctaButton}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link></div>
      <ol className={styles.steps}>{c.steps.map(([title, text], index) => <li key={title}><span>{destinationCount(index + 1, locale)}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    </section>
    <section className={styles.faqSection} id="questions" aria-labelledby="faq-title"><div className={`${styles.wrap} ${styles.faqGrid}`}><div><p className={styles.eyebrow}>{c.faqEyebrow}</p><h2 id="faq-title">{c.faqTitle}</h2><p className={styles.faqNote}>{fa ? "انتخاب بهتر، با پرسیدن شروع می‌شود." : "Better choices begin with good questions."}</p></div><div className={styles.faqList}>{c.faqs.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
    <section className={`${styles.wrap} ${styles.cta}`} aria-labelledby="cta-title"><div><p className={styles.heroEyebrow}>{c.ctaEyebrow}</p><h2 id="cta-title">{c.ctaTitle}</h2><p>{c.ctaText}</p></div><Link className={styles.primary} href={consultation}>{c.ctaButton}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link></section>
    <div className={`${styles.wrap} ${styles.bottom}`}><span lang="en">JAHAN ACADEMY · STUDY, GROW, BELONG</span><a href="#destinations-top">{c.top} ↑</a></div>
  </main></SiteShell>;
}
