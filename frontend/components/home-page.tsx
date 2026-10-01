import Image from "next/image";
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
function Arrow({ locale }: { locale: Locale }) {
  return <span aria-hidden="true">{locale === "fa" ? "↖" : "↗"}</span>;
}

function SectionHeading({ id, eyebrow, title, text, href, linkText }: {
  id: string; eyebrow: string; title: string; text: string; href?: string; linkText?: string;
}) {
  return <div className="home-section-heading">
    <div><p className="home-eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2><p>{text}</p></div>
    {href && linkText && <Link className="home-section-heading__link" href={href}>{linkText} <span aria-hidden="true">↗</span></Link>}
  </div>;
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
  const visibleArticles = articles.filter((article) => article.type === "article").slice(0, 2);

  return <SiteShell locale={locale}><main className="home-page">
    <div className={`home-hero home-hero--${locale}`} aria-hidden="true">
      <Image src="/home-hero-campus-v2.png" alt="" fill sizes="100vw" preload className="home-hero__image" />
      <div className="home-hero__shade" />
    </div>

    <section className="home-start shell" aria-labelledby="home-start-title">
      <div className="home-start__lead"><p className="home-eyebrow">START HERE</p><h2 id="home-start-title">{content.startTitle}</h2><p>{content.startText}</p></div>
      <ol className="home-start__steps">{content.steps.map((step) => <li key={step.number}><span>{step.number}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol>
    </section>

    <section className="home-section home-section--soft" aria-labelledby="home-destinations-title"><div className="shell">
      <h2 id="home-destinations-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/countries")}>{copy.destinationsTitle}<span className="home-destinations__title-arrow" aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></h2>
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
      <h2 id="home-services-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/services")}>{locale === "fa" ? "خدمات موسسه ما" : "Our institute’s services"}<span className="home-destinations__title-arrow" aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></h2>
      <div className="home-services" dir={locale === "fa" ? "rtl" : "ltr"}>{homeServices.map((service) => <article key={service.id} className="home-service-card">
        <span className="home-service-card__icon"><ServiceGlyph id={service.id} /></span><h3>{service.title[locale]}</h3><p>{service.description[locale]}</p>
      </article>)}</div>
    </div></section>

    <section className="home-section home-section--tinted" aria-labelledby="home-universities-title"><div className="shell">
      <h2 id="home-universities-title" className="home-destinations__title" dir={locale === "fa" ? "rtl" : "ltr"}><Link href={localPath(locale, "/universities")}>{copy.universitiesTitle}<span className="home-destinations__title-arrow" aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></Link></h2>
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
      <ol className="home-process__steps">{content.processSteps.map((step) => <li className="home-process__step" key={step.number}>
        <span className="home-process__number" aria-hidden="true">{step.number}</span>
        <div><h3>{step.title}</h3><p>{step.text}</p></div>
      </li>)}</ol>
    </div></section>

    <section className="home-section" aria-labelledby="home-articles-title"><div className="shell">
      <SectionHeading id="home-articles-title" eyebrow={content.articleEyebrow} title={copy.articlesTitle} text={content.articleText} href={localPath(locale, "/articles")} linkText={content.sectionLink} />
      <div className="home-articles">{visibleArticles.map((article, index) => <article className="home-article-card" key={article.slug}>
        <div className="home-article-card__media" aria-hidden="true"><span>0{index + 1}</span></div><div className="home-article-card__body"><small>{content.articleLabel} · <time dateTime={article.date}>{article.date}</time></small><h3>{article.title[locale]}</h3><p>{article.excerpt[locale]}</p><Link href={localPath(locale, `/articles/${article.slug}`)}>{copy.readMore} <Arrow locale={locale} /></Link></div>
      </article>)}</div>
    </div></section>

    <section className="home-section home-section--soft" aria-labelledby="home-faq-title"><div className="shell home-faq__grid">
      <div><p className="home-eyebrow">{content.faqEyebrow}</p><h2 id="home-faq-title">{copy.faqTitle}</h2><p>{content.faqText}</p><Link className="home-faq__link" href={localPath(locale, "/faq")}>{content.sectionLink} <Arrow locale={locale} /></Link></div>
      <div className="home-faq__list">{brand.faqs.slice(0, 4).map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
    </div></section>

    <section className="home-closing"><div className="shell home-closing__inner"><div><p className="home-eyebrow">JAHAN ACADEMY</p><h2>{content.closingTitle}</h2><p>{content.closingText}</p></div><ConsultationButton locale={locale} source="home-footer" /></div></section>
  </main></SiteShell>;
}
