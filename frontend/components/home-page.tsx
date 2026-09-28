import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ConsultationButton, localPath, SiteShell } from "@/components/site-shell";
import { ButtonLink } from "@/components/ui";
import { getUniversityShowcases } from "@/lib/public-api";
import { getHomeContent } from "@/lib/home-content";
import {
  articles, countryGuides, faqItems, fixtureUniversities, services, siteCopy,
  type Locale, type UniversityShowcase,
} from "@/lib/site-content";

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

function ServiceGlyph({ slug }: { slug: string }) {
  const paths: Record<string, ReactNode> = {
    "education-consultation": <><path d="M4 19.5V5.8c2.6-1.4 5.4-1.3 8 0v13.7c-2.6-1.3-5.4-1.4-8 0Z" /><path d="M20 19.5V5.8c-2.6-1.4-5.4-1.3-8 0v13.7c2.6-1.3 5.4-1.4 8 0Z" /></>,
    "admission-guidance": <><path d="m3 17 5.5-5.5 3.5 3.5 8-8" /><path d="M15 7h5v5" /><path d="M4 21h16" /></>,
    "document-review": <><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
  };
  return <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[slug]}</svg>;
}

function UniversityCard({ university, locale }: { university: UniversityShowcase; locale: Locale }) {
  const location = [university.city?.[locale], university.country[locale]].filter(Boolean).join("، ");
  return <article className="home-university-card">
    <div className="home-university-card__top"><span className="home-university-card__mark" aria-hidden="true">{university.name.en.slice(0, 1)}</span><span>{university.country[locale]}</span></div>
    <h3>{university.name[locale]}</h3>
    <p className="home-university-card__location">{location}</p>
    <p>{university.summary[locale]}</p>
    <Link href={localPath(locale, `/universities/${university.slug}`)}>{siteCopy[locale].viewDetails} <Arrow locale={locale} /></Link>
  </article>;
}

export async function HomePage({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale];
  const content = getHomeContent(locale);
  const publicUniversities = await getUniversityShowcases(locale);
  const universities = (publicUniversities.length ? publicUniversities : fixtureUniversities).slice(0, 3);
  const visibleArticles = articles.filter((article) => article.type === "article").slice(0, 2);

  return <SiteShell locale={locale}><main className="home-page">
    <section className={`home-hero home-hero--${locale}`} aria-labelledby="home-title">
      <Image src="/home-hero-compact.png" alt="" fill sizes="100vw" preload className="home-hero__image" />
      <div className="home-hero__shade" aria-hidden="true" />
      <div className="shell home-hero__content">
        <div className="home-hero__copy" dir={locale === "fa" ? "rtl" : "ltr"}>
          <h1 id="home-title">{copy.heroTitle}</h1>
          <p className="home-hero__description">{copy.heroText}</p>
          <div className="home-hero__actions"><ButtonLink variant="ghost" href={localPath(locale, "/services")}>{content.heroServiceLink} <span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span></ButtonLink><ConsultationButton locale={locale} source="home-hero" /></div>
        </div>
      </div>
    </section>

    <section className="home-start shell" aria-labelledby="home-start-title">
      <div className="home-start__lead"><p className="home-eyebrow">START HERE</p><h2 id="home-start-title">{content.startTitle}</h2><p>{content.startText}</p></div>
      <ol className="home-start__steps">{content.steps.map((step) => <li key={step.number}><span>{step.number}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol>
    </section>

    <section className="home-section home-section--soft" aria-labelledby="home-destinations-title"><div className="shell">
      <SectionHeading id="home-destinations-title" eyebrow={content.destinationEyebrow} title={copy.destinationsTitle} text={content.destinationText} href={localPath(locale, "/countries")} linkText={content.sectionLink} />
      <div className="home-destinations">{countryGuides.map((guide, index) => <Link key={guide.slug} className={`home-destination home-destination--${index + 1}`} href={localPath(locale, `/countries/${guide.slug}`)}>
        <span className="home-destination__number">0{index + 1}</span><span className="home-destination__inner"><small>{content.destinationLabel}</small><strong>{guide.title[locale]}</strong><span className="home-destination__arrow"><Arrow locale={locale} /></span></span>
      </Link>)}</div>
    </div></section>

    <section className="home-section" aria-labelledby="home-services-title"><div className="shell">
      <SectionHeading id="home-services-title" eyebrow={content.serviceEyebrow} title={copy.servicesTitle} text={content.serviceText} href={localPath(locale, "/services")} linkText={content.sectionLink} />
      <div className="home-services">{services.map((service, index) => <Link key={service.slug} className="home-service-card" href={localPath(locale, `/services/${service.slug}`)}>
        <span className="home-service-card__icon"><ServiceGlyph slug={service.slug} /></span><span className="home-service-card__index">0{index + 1}</span><small>{content.serviceLabel}</small><h3>{service.title[locale]}</h3><p>{service.summary[locale]}</p><span className="home-service-card__link">{copy.viewDetails} <Arrow locale={locale} /></span>
      </Link>)}</div>
    </div></section>

    <section className="home-section home-section--tinted" aria-labelledby="home-universities-title"><div className="shell">
      <SectionHeading id="home-universities-title" eyebrow={content.universityEyebrow} title={copy.universitiesTitle} text={content.universityText} href={localPath(locale, "/universities")} linkText={content.sectionLink} />
      <div className="home-universities">{universities.map((university) => <UniversityCard key={university.slug} university={university} locale={locale} />)}</div>
      <p className="home-universities__note">{content.universityNote}</p>
    </div></section>

    <section className="home-section home-trust" aria-labelledby="home-trust-title"><div className="shell home-trust__grid">
      <div className="home-trust__intro"><p className="home-eyebrow">{content.trustEyebrow}</p><h2 id="home-trust-title">{copy.trustTitle}</h2><p>{copy.trustText}</p><ConsultationButton locale={locale} source="home-trust" /></div>
      <div className="home-trust__values">{content.trustValues.map((value) => <div key={value.number}><span>{value.number}</span><div><h3>{value.title}</h3><p>{value.text}</p></div></div>)}</div>
    </div></section>

    <section className="home-process"><div className="shell home-process__inner"><div><p className="home-eyebrow">{content.processEyebrow}</p><h2>{content.processTitle}</h2><p>{content.processText}</p></div><Link href={localPath(locale, "/about")}>{locale === "fa" ? "درباره رویکرد ما" : "About our approach"} <Arrow locale={locale} /></Link></div></section>

    <section className="home-section" aria-labelledby="home-articles-title"><div className="shell">
      <SectionHeading id="home-articles-title" eyebrow={content.articleEyebrow} title={copy.articlesTitle} text={content.articleText} href={localPath(locale, "/articles")} linkText={content.sectionLink} />
      <div className="home-articles">{visibleArticles.map((article, index) => <article className="home-article-card" key={article.slug}>
        <div className="home-article-card__media" aria-hidden="true"><span>0{index + 1}</span></div><div className="home-article-card__body"><small>{content.articleLabel} · <time dateTime={article.date}>{article.date}</time></small><h3>{article.title[locale]}</h3><p>{article.excerpt[locale]}</p><Link href={localPath(locale, `/articles/${article.slug}`)}>{copy.readMore} <Arrow locale={locale} /></Link></div>
      </article>)}</div>
    </div></section>

    <section className="home-section home-section--soft" aria-labelledby="home-faq-title"><div className="shell home-faq__grid">
      <div><p className="home-eyebrow">{content.faqEyebrow}</p><h2 id="home-faq-title">{copy.faqTitle}</h2><p>{content.faqText}</p><Link className="home-faq__link" href={localPath(locale, "/faq")}>{content.sectionLink} <Arrow locale={locale} /></Link></div>
      <div className="home-faq__list">{faqItems[locale].map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
    </div></section>

    <section className="home-closing"><div className="shell home-closing__inner"><div><p className="home-eyebrow">JAHAN ACADEMY</p><h2>{content.closingTitle}</h2><p>{content.closingText}</p></div><ConsultationButton locale={locale} source="home-footer" /></div></section>
  </main></SiteShell>;
}
