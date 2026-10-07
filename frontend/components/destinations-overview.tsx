import { PanelConsultationCallout } from "@/components/panel-consultation-callout";

import Image from "next/image";

import { SiteShell } from "@/components/site-shell";
import { PublicPanelsMotion } from "./public-panels-motion";
import { DestinationDecisionGuide } from "@/components/destination-decision-guide";
import { DestinationsExplorer } from "@/components/destinations-explorer";
import { DestinationsNavigation } from "@/components/destinations-overview-interactive";
import { HomeFaq } from "@/components/home-faq";
import { DestinationsConsultation } from "@/components/destinations-consultation";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

const copy = {
  fa: {
    intro: "کشورها را بشناسید، اولویت‌هایتان را روشن کنید و برای بررسی شرایط خود درخواست مشاوره رایگان ثبت کنید.",
    overviewText: "این راهنما نقطه شروع آشنایی با مقصدها، زبان‌های رایج و فضای زندگی در آن‌هاست.",
    collectionTitle: "کشور مناسب خود را پیدا کنید",
    faqs: [
      ["شناخت مقصد را از کجا شروع کنم؟", "از زبان روزمره، شهرها، آب‌وهوا، سبک زندگی و فاصله از خانواده شروع کنید. معرفی کشورها به شناخت اولیه کمک می‌کند؛ برای بررسی مسیر متناسب با شرایط شما، درخواست مشاوره رایگان ثبت کنید."],
      ["آیا زندگی در تمام شهرهای یک کشور یکسان است؟", "خیر. فضای شهری، حمل‌ونقل، آب‌وهوا و دسترسی به خدمات می‌تواند از شهری به شهر دیگر متفاوت باشد. ترجیح‌های شخصی خود را در جلسه مشاوره مطرح کنید."],
      ["اگر هنوز کشور موردنظرم را انتخاب نکرده باشم، می‌توانم مشاوره بگیرم؟", "بله. لازم نیست پیش از ثبت درخواست مقصد مشخصی داشته باشید؛ تیم جهان آکادمی شرایط و اولویت‌های شما را در گفت‌وگو بررسی می‌کند."],
      ["برای گفت‌وگوی مشاوره چه اطلاعاتی آماده کنم؟", "هدف تحصیلی، آخرین مدرک، وضعیت زبان، ترجیح‌های مربوط به مقصد و پرسش‌های خود را آماده کنید تا گفت‌وگو روشن‌تر باشد."],
    ],
    ctaTitle: "هنوز مقصدتان را انتخاب نکرده‌اید؟",
    ctaText: "با هم شرایط و اولویت‌های شما را مرور می‌کنیم تا انتخاب بعدی‌تان روشن‌تر باشد.",
  },
  en: {
    intro: "Explore countries, clarify your priorities and request a free consultation to discuss your circumstances.",
    overviewText: "This guide introduces destinations, their common languages and everyday settings.",
    collectionTitle: "Find a place that fits your plans",
    faqs: [
      ["Where should I start exploring a destination?", "Start with everyday language, cities, climate, lifestyle and distance from family. Country introductions offer an initial overview; request a free consultation to discuss a path suited to your circumstances."],
      ["Is everyday life the same in every city of a country?", "No. Urban settings, transport, climate and access to services can vary between cities. Discuss your personal preferences during a consultation."],
      ["Can I request consultation before choosing a country?", "Yes. You do not need a destination in mind before submitting a request. The Jahan Academy team will discuss your circumstances and priorities with you."],
      ["What should I prepare for a consultation?", "Prepare your academic goals, latest qualification, language background, destination preferences and questions to make the conversation clearer."],
    ],
    ctaTitle: "Still looking for your destination?",
    ctaText: "Let us review your situation and priorities together, so your next choice feels clearer.",
  },
};
const sectionIds = ["destination-countries", "destination-criteria", "destination-comparison", "destination-faq"];

export function DestinationsOverview({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const fa = locale === "fa";
  const t = (persian: string, english: string) => fa ? persian : english;
  const labels = [t("مقصدهای تحصیلی", "Study destinations"), t("شناخت مقصد", "Explore destinations"), t("کشورها در یک نگاه", "Countries at a glance"), t("پرسش‌های متداول", "Frequently asked questions")];

  return <SiteShell locale={locale}><PublicPanelsMotion panel="destinations" className={styles.page}>
    <section className={styles.hero} aria-labelledby="destination-wordmark">
      <Image className={styles.heroArtwork} src="/destinations/world-map-hero-wide.png" alt={t("نقشه برجسته جهان با نورهای طلایی", "A raised world map illuminated in warm gold")} fill sizes="100vw" preload />
      <div className={styles.heroShade} aria-hidden="true" />
      <h1 className={styles.heroBrand} id="destination-wordmark" dir="ltr" lang="en">JAHAN ACADEMY</h1>
    </section>
    <div className={`shell ${styles.guide}`}>
      <div className={styles.guideContent}>
        <DestinationsNavigation title={t("راهنمای مقصدهای تحصیلی جهان", "A guide to study destinations worldwide")} items={labels.map((label, index) => ({ id: sectionIds[index], label })).filter(item => item.id !== "destination-faq")} />
        <div className={styles.intro}><p>{c.intro} {c.overviewText}</p></div>
        <PanelConsultationCallout locale={locale} panel="destinations" />
<section className={styles.section} id={sectionIds[0]}><h2>{c.collectionTitle}</h2><DestinationsExplorer locale={locale} /></section>
        <DestinationDecisionGuide locale={locale} />
        <section className={`${styles.section} ${styles.faq}`} id={sectionIds[3]}><div className="home-faq__grid"><div className="home-faq__intro"><h2>{labels[3]}</h2></div><HomeFaq items={c.faqs.map(([question, answer]) => ({ question, answer }))} /></div></section>
      </div>
      <section className={`home-closing ${styles.consultation}`} id="destination-consultation" aria-labelledby="destination-closing-title"><header className="home-closing__heading"><h2 id="destination-closing-title">{c.ctaTitle}</h2><p>{c.ctaText}</p></header><div className="home-closing__layout"><div className="home-closing__image"><Image src="/journey/profile-assessment.png" alt={t("مشاوره انتخاب مقصد تحصیلی", "Study destination consultation")} fill sizes="(max-width: 800px) 100vw, 50vw" /></div><DestinationsConsultation locale={locale} /></div></section>
    </div>
  </PublicPanelsMotion></SiteShell>;
}
