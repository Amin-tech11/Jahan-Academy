
import Image from "next/image";

import { SiteShell } from "@/components/site-shell";
import { DestinationDecisionGuide } from "@/components/destination-decision-guide";
import { DestinationsExplorer } from "@/components/destinations-explorer";
import { DestinationsNavigation } from "@/components/destinations-overview-interactive";
import { HomeFaq } from "@/components/home-faq";
import { DestinationsConsultation } from "@/components/destinations-consultation";
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
    collection: "فهرست مقصدها", collectionTitle: "کشور مناسب خود را پیدا کنید",
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
    collection: "DESTINATION DIRECTORY", collectionTitle: "Find a place that fits your plans",
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

const sectionIds = ["destination-countries", "destination-planning", "destination-criteria", "destination-comparison", "destination-budget", "destination-readiness", "destination-faq"];

export function DestinationsOverview({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const fa = locale === "fa";
  const t = (persian: string, english: string) => fa ? persian : english;
  const labels = [t("مقصدهای تحصیلی", "Study destinations"), t("برنامه‌ریزی تحصیلی", "Study planning"), t("معیارهای انتخاب", "Selection criteria"), t("مقایسه مقصدها", "Comparing destinations"), t("بودجه مقصد", "Destination budget"), t("چک‌لیست آمادگی", "Readiness checklist"), t("پرسش‌های متداول", "Frequently asked questions")];

  return <SiteShell locale={locale}><main className={styles.page}>
    <section className={styles.hero} aria-labelledby="destination-wordmark">
      <Image className={styles.heroArtwork} src="/destinations/world-map-hero-wide.png" alt={t("نقشه برجسته جهان با نورهای طلایی", "A raised world map illuminated in warm gold")} fill sizes="100vw" preload />
      <div className={styles.heroShade} aria-hidden="true" />
      <h1 className={styles.heroBrand} id="destination-wordmark" dir="ltr" lang="en">JAHAN ACADEMY</h1>
    </section>
    <div className={`shell ${styles.guide}`}>
      <div className={styles.guideContent}>
        <DestinationsNavigation title={t("راهنمای مقصدهای تحصیلی جهان", "A guide to study destinations worldwide")} items={labels.map((label, index) => ({ id: sectionIds[index], label }))} />
        <div className={styles.intro}><p>{c.intro} {c.overviewText}</p></div>
        <section className={styles.section} id={sectionIds[0]}><h2>{c.collectionTitle}</h2><DestinationsExplorer locale={locale} /></section>
        <DestinationDecisionGuide locale={locale} />
        <section className={`${styles.section} ${styles.faq}`} id={sectionIds[6]}><div className="home-faq__grid"><div className="home-faq__intro"><h2>{labels[6]}</h2></div><HomeFaq items={c.faqs.map(([question, answer]) => ({ question, answer }))} /></div></section>
      </div>
      <section className={`home-closing ${styles.consultation}`} id="destination-consultation" aria-labelledby="destination-closing-title"><header className="home-closing__heading"><h2 id="destination-closing-title">{c.ctaTitle}</h2><p>{c.ctaText}</p></header><div className="home-closing__layout"><div className="home-closing__image"><Image src="/journey/profile-assessment.png" alt={t("مشاوره انتخاب مقصد تحصیلی", "Study destination consultation")} fill sizes="(max-width: 800px) 100vw, 50vw" /></div><DestinationsConsultation locale={locale} /></div></section>
    </div>
  </main></SiteShell>;
}