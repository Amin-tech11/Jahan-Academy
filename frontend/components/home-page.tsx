import Image from "next/image";
import { HomeConsultation } from "@/components/home-consultation";
import { HomeFaq } from "@/components/home-faq";
import { HomeNewsTicker } from "@/components/home-news-ticker";
import { HomeJourneyProgress } from "@/components/home-journey-progress";
import Link from "next/link";
import type { ReactNode } from "react";

import { ConsultationButton, localPath, SiteShell } from "@/components/site-shell";
import { brandContent } from "@/lib/brand-content";
import { getHomeContent } from "@/lib/home-content";
import { HomeUniversityShowcase } from "@/components/home-university-showcase";
import {
  articles, headerDestinations, siteCopy,
  type Locale,
} from "@/lib/site-content";

const destinationSlugs = ["united-kingdom", "germany", "italy", "netherlands", "canada"] as const;
const homeServices = [
  {
    id: "language",
    title: { fa: "پشتیبانی در مسیر یادگیری زبان", en: "Language learning support" },
    description: { fa: "با عضویت در پلتفرم آموزش زبان انگلیسی Kalum و دریافت کد تخفیف ویژه، در مسیر یادگیری زبان همراهتان هستیم.", en: "Get support for learning English through the Kalum platform and a special discount code." },
  },
  {
    id: "documents",
    title: { fa: "نگارش و ویرایش مدارک موردنیاز", en: "Application document writing and editing" },
    description: { fa: "رزومه تحصیلی، انگیزه‌نامه و سایر مدارک موردنیاز پرونده شما را نگارش و ویرایش می‌کنیم.", en: "We write and edit your academic CV, statement of purpose, and other required application documents." },
  },
  {
    id: "options",
    title: { fa: "پیشنهاد گزینه‌های مناسب", en: "Suitable study options" },
    description: { fa: "کشور، دانشگاه و رشته‌های مناسب در آلمان، انگلستان، اسپانیا و فنلاند را بررسی و پیشنهاد می‌کنیم.", en: "We review and recommend suitable countries, universities, and programs in Germany, the UK, Spain, and Finland." },
  },
  {
    id: "assessment",
    title: { fa: "بررسی تخصصی شرایط هر متقاضی", en: "Individual applicant assessment" },
    description: { fa: "سوابق تحصیلی، سطح زبان، بودجه و اهداف هر دانشجو را بررسی می‌کنیم.", en: "We assess each student's academic background, language level, budget, and goals." },
  },
] as const;
const processImages = [
  "profile-assessment", "profile-assessment", "document-preparation", "document-preparation",
  "study-options", "document-preparation", "study-options", "study-options", "study-options",
  "profile-assessment", "document-preparation", "document-preparation", "language-support",
].map((name) => `/journey/${name}.png`);

function Arrow({ locale }: { locale: Locale }) {
  return <span aria-hidden="true">{locale === "fa" ? "↖" : "↗"}</span>;
}

function ServiceGlyph({ id }: { id: (typeof homeServices)[number]["id"] }) {
  const paths: Record<string, ReactNode> = {
    language: <><path d="M12 6.2c-2.7-1.5-5.3-1.5-8-.1v12.3c2.7-1.4 5.3-1.4 8 .1 2.7-1.5 5.3-1.5 8-.1V6.1c-2.7-1.4-5.3-1.4-8 .1Z" /><path d="M12 6.2v12.3" /></>,
    documents: <><path d="M6 3h8l4 4v6M14 3v4h4M6 3v18h8M9 11h5M9 15h4" /><path d="m15 19 5-5 2 2-5 5-3 .5.5-2.5Z" /></>,
    options: <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v7" /></>,
    assessment: <><circle cx="10" cy="7" r="3.5" /><path d="M3 19v-1a7 7 0 0 1 11-5.7" /><circle cx="17.5" cy="16.5" r="3.5" /><path d="m20 19 2.5 2.5" /></>,
  };
  return <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[id]}</svg>;
}

export async function HomePage({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale];
  const content = getHomeContent(locale);
  const brand = brandContent[locale];
  const visibleArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date));

  return <SiteShell locale={locale}><main className="home-page">
    <div className={`home-hero home-hero--${locale}`} aria-hidden="true">
      <Image src="/home-hero-campus-v2.png" alt="" fill sizes="100vw" preload className="home-hero__image" />
      <div className="home-hero__shade" />
    </div>

    <section className="home-start shell" aria-label={locale === "fa" ? "شروع مسیر با جهان آکادمی" : "Start your journey with Jahan Academy"}>
      <ul className="home-start__features">
        {[
          { path: "M4 15a8 8 0 1 1 4 4l-5 2 1-6Z M8 11h.01 M12 11h.01 M16 11h.01", fa: ["مشاوره تخصصی", "بررسی اهداف و شرایط شما در گفت‌وگو با مشاور"], en: ["Expert consultation", "Discuss your goals and circumstances with an advisor"] },
          { path: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M16 8l-2 6-6 2 2-6 6-2Z", fa: ["بررسی مسیر تحصیلی", "انتخاب دانشگاه و رشته متناسب با شرایط شما"], en: ["Your study pathway", "Explore universities and programs suited to your profile"] },
          { path: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 11h6 M9 15h6 M9 18h4", fa: ["راهنمای مدارک", "چک‌لیست، نگارش و بررسی مدارک پذیرش و ویزا"], en: ["Document guidance", "Checklists, writing and review for admission and visa documents"] },
          { path: "M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M6 21v-2a6 6 0 0 1 12 0v2H6Z M5 6a2.5 2.5 0 0 0 0 5 M19 6a2.5 2.5 0 0 1 0 5 M2 18v-1a5 5 0 0 1 4-5 M22 18v-1a5 5 0 0 0-4-5", fa: ["همراهی تا دریافت نتیجه", "پیگیری پرونده در مراحل پذیرش و درخواست ویزا"], en: ["Support through the outcome", "Follow-up throughout admission and the visa application"] },
        ].map((feature) => <li key={feature.en[0]}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={feature.path} /></svg>
          <h2>{feature[locale][0]}</h2><p>{feature[locale][1]}</p>
        </li>)}
      </ul>
    </section>

    <section className="home-section home-section--soft" aria-labelledby="home-destinations-title"><div className="shell">
      <h2 id="home-destinations-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/countries")}>{copy.destinationsTitle}<svg className="home-destinations__title-arrow" aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M1 8 12 1v14L1 8Z" /></svg></Link></h2>
      <div className="home-destinations">{destinationSlugs.map((slug, index) => {
        const destination = headerDestinations.find((entry) => entry.slug === slug);
        if (!destination) return null;
        return <Link key={slug} className="home-destination" href={localPath(locale, `/countries/${slug}`)}>
          <Image src={`/destinations/${slug}.png`} alt="" fill sizes={index < 2 ? "(max-width: 600px) 100vw, (max-width: 800px) 50vw, 50vw" : "(max-width: 600px) 100vw, (max-width: 800px) 50vw, 33vw"} className="home-destination__image" />
          <span className="home-destination__label"><span className="home-destination__flag"><Image src={`/destinations/flags/${slug}.svg`} alt="" width={44} height={44} /></span><strong>{destination[locale]}</strong></span>
        </Link>;
      })}</div>
    </div></section>

    <section className="home-section" aria-labelledby="home-services-title"><div className="shell">
      <h2 id="home-services-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/services")}>{locale === "fa" ? "خدمات موسسه ما" : "Our institute’s services"}<svg className="home-destinations__title-arrow" aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M1 8 12 1v14L1 8Z" /></svg></Link></h2>
      <div className="home-services" dir={locale === "fa" ? "rtl" : "ltr"}>{homeServices.map((service) => <Link key={service.id} className="home-service-card" href={localPath(locale, `/services#${service.id}`)}>
        <span className="home-service-card__icon"><ServiceGlyph id={service.id} /></span><h3>{service.title[locale]}</h3><p>{service.description[locale]}</p>
      </Link>)}</div>
    </div></section>

    <section className="home-section home-section--tinted" aria-labelledby="home-universities-title"><div className="shell">
      <h2 id="home-universities-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/universities")}>{copy.universitiesTitle}<svg className="home-destinations__title-arrow" aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M1 8 12 1v14L1 8Z" /></svg></Link></h2>
      <HomeUniversityShowcase locale={locale} />
      <p className="home-universities__note">{content.universityNote}</p>
    </div></section>

    <section className="home-section home-trust" aria-labelledby="home-trust-title"><div className="shell home-trust__inner">
      <div className="home-trust__header">
        <div className="home-trust__intro"><h2 id="home-trust-title">{brand.whyTitle}</h2><p>{brand.whyText}</p></div>
        <ConsultationButton locale={locale} source="home-trust" />
      </div>
      <ul className="home-trust__values">{content.trustValues.map((value) => <li className="home-trust__value" key={value.number}>
        <span className="home-trust__number" aria-hidden="true">{value.number}</span><h3>{value.title}</h3><p>{value.text}</p>
      </li>)}</ul>
    </div></section>

    <section className="home-section home-process" aria-labelledby="home-process-title"><div className="shell">
      <h2 id="home-process-title" className="home-destinations__title">{content.processTitle}</h2>
      <HomeJourneyProgress>{content.processSteps.map((step, index) => <li className="home-process__step" key={step.number}>
        <div className="home-process__rail" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 0 C50 18 15 32 50 50 C85 68 50 82 50 100" /></svg><span className="home-process__number">{Number(step.number)}</span></div>
        <div className="home-process__media"><Image src={processImages[index]} alt="" fill sizes="(max-width: 700px) 90vw, 40vw" /></div>
        <div className="home-process__copy" dir={locale === "fa" ? "rtl" : "ltr"}><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}</HomeJourneyProgress>
    </div></section>

    <section className="home-section" aria-labelledby="home-articles-title"><div className="shell">
      <h2 id="home-articles-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/articles")}>{locale === "fa" ? "خبر ها" : "News"}<svg className="home-destinations__title-arrow" aria-hidden="true" width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M1 8 12 1v14L1 8Z" /></svg></Link></h2>
      <HomeNewsTicker items={visibleArticles} locale={locale} />
    </div></section>

    <section className="home-section home-section--soft" aria-labelledby="home-faq-title"><div className="shell home-faq__grid">
      <div className="home-faq__intro"><h2 id="home-faq-title">{locale === "fa" ? "سوالات متداول" : "Frequently Asked Questions"}</h2></div>
      <HomeFaq items={brand.faqs.slice(0, 5)} />
    </div></section>

    <section className="home-closing" id="home-consultation" aria-labelledby="home-closing-title">
      <div className="shell">
        <header className="home-closing__heading"><h2 id="home-closing-title">{content.closingTitle}</h2><p>{content.closingText.replaceAll("هٔ", "ه")}</p></header>
        <div className="home-closing__layout">
          <div className="home-closing__image"><Image src="/journey/profile-assessment.png" alt={locale === "fa" ? "مشاوره درباره مسیر تحصیلی" : "Study pathway consultation"} fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
          <HomeConsultation locale={locale} />
        </div>
      </div>
    </section>
  </main></SiteShell>;
}
