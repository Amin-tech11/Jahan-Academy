import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { localPath, SiteShell } from "@/components/site-shell";
import { isLocale, type Locale } from "@/lib/site-content";

import "../../services.css";

type PageProps = { params: Promise<{ locale: string }> };

const content = {
  fa: {
    title: "خدمات جهان آکادمی",
    intro: "از بررسی شرایط فردی تا آماده‌سازی پرونده و برنامه‌ریزی زبان، هر گام را متناسب با هدف تحصیلی شما پیش می‌بریم.",
    jumpLabel: "فهرست خدمات",
    detailsLabel: "جزئیات خدمت",
    services: [
      {
        id: "assessment", number: "01", short: "بررسی شرایط", title: "بررسی تخصصی شرایط هر متقاضی",
        description: "مسیر تحصیلی با شناخت شما آغاز می‌شود. سوابق تحصیلی، سطح زبان، بودجه و هدف‌های شما را کنار هم می‌گذاریم تا نقطه شروع روشن باشد.",
        points: ["سوابق و مقطع تحصیلی", "سطح زبان و زمان‌بندی", "بودجه و هدف دانشجو"], symbol: "◎",
      },
      {
        id: "options", number: "02", short: "پیشنهاد گزینه‌ها", title: "پیشنهاد گزینه‌های مناسب",
        description: "بر پایه شرایط و اولویت‌ها، کشور، دانشگاه و رشته‌های مرتبط را بررسی می‌کنیم؛ از جمله گزینه‌های تحصیل در آلمان، انگلستان، اسپانیا و فنلاند.",
        points: ["بررسی کشور و دانشگاه", "تناسب رشته با هدف", "مقایسه گزینه‌های قابل بررسی"], symbol: "↗",
      },
      {
        id: "documents", number: "03", short: "آماده‌سازی مدارک", title: "نگارش و ویرایش مدارک موردنیاز",
        description: "برای آماده شدن پرونده، در تنظیم و بازبینی رزومه تحصیلی، انگیزه‌نامه و دیگر مدارک موردنیاز همراهتان هستیم.",
        points: ["رزومه تحصیلی", "انگیزه‌نامه", "بازبینی مدارک پرونده"], symbol: "✎",
      },
      {
        id: "language", number: "04", short: "پشتیبانی زبان", title: "پشتیبانی در مسیر یادگیری زبان",
        description: "زبان بخشی از برنامه تحصیلی شماست. درباره مسیر یادگیری و امکان استفاده از پلتفرم آموزش انگلیسی Kalum و شرایط تخفیف ویژه راهنمایی می‌کنیم.",
        points: ["بررسی نیاز زبانی", "برنامه‌ریزی برای یادگیری", "آشنایی با Kalum"], symbol: "Aa",
      },
    ],
    partnerKicker: "برای همکاران",
    partnerTitle: "همکاری با مؤسسات و آژانس‌های مسافرتی",
    partnerText: "اگر با متقاضیان تحصیل در خارج از کشور در ارتباط هستید، اطلاعات اولیه پرونده را با تیم جهان آکادمی در میان بگذارید تا درباره شیوه همکاری و خدمات متناسب با هر پرونده گفت‌وگو کنیم.",
    partnerNote: "جزئیات همکاری و هزینه خدمات پس از بررسی هر پرونده اعلام می‌شود.",
    ctaTitle: "مسیر تحصیلی شما از یک گفت‌وگوی دقیق شروع می‌شود.",
    ctaText: "شرایط و هدف خود را با ما در میان بگذارید تا گام بعدی را با هم بررسی کنیم.",
    cta: "شروع گفت‌وگو",
  },
  en: {
    title: "Jahan Academy services",
    intro: "From understanding your circumstances to preparing your application and language plan, we shape each step around your academic goals.",
    jumpLabel: "Explore services",
    detailsLabel: "Service details",
    services: [
      {
        id: "assessment", number: "01", short: "Your profile", title: "A thoughtful review of your profile",
        description: "Your academic path starts with understanding you. We look at your education, language level, budget, and goals together to establish a clear starting point.",
        points: ["Academic background", "Language level and timeline", "Budget and goals"], symbol: "◎",
      },
      {
        id: "options", number: "02", short: "Suitable options", title: "Options suited to your goals",
        description: "Based on your priorities, we explore relevant countries, universities, and programs, including options in Germany, the UK, Spain, and Finland.",
        points: ["Country and university review", "Program fit", "Comparable options"], symbol: "↗",
      },
      {
        id: "documents", number: "03", short: "Documents", title: "Writing and reviewing documents",
        description: "We help you prepare and review your academic CV, statement of purpose, and other documents needed for your application.",
        points: ["Academic CV", "Statement of purpose", "Application document review"], symbol: "✎",
      },
      {
        id: "language", number: "04", short: "Language support", title: "Support for your language journey",
        description: "Language learning belongs in your study plan. We can discuss your learning path and access to the Kalum English learning platform, including any available discount terms.",
        points: ["Language needs", "Learning plan", "Introducing Kalum"], symbol: "Aa",
      },
    ],
    partnerKicker: "For partners",
    partnerTitle: "Working with institutions and travel agencies",
    partnerText: "If you work with prospective international students, share the initial case details with Jahan Academy so we can discuss the right service and partnership approach.",
    partnerNote: "Partnership terms and service fees are discussed after each case is reviewed.",
    ctaTitle: "A considered academic path begins with a conversation.",
    ctaText: "Tell us about your goals and circumstances, and we can discuss the next step together.",
    cta: "Start a conversation",
  },
} as const;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `${content[locale].title} | Jahan Academy` };
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = content[locale as Locale];

  return <SiteShell locale={locale}>
    <main className="services-page">
      <section className="services-hero" aria-label={copy.title}>
        <div className="services-hero__brand">JAHAN ACADEMY</div>
      </section>

      <section className="services-intro" aria-labelledby="services-title">
        <div className="services-container">
          <p className="services-kicker">JAHAN ACADEMY / SERVICES</p>
          <h1 id="services-title">{copy.title}</h1>
          <p className="services-intro__text">{copy.intro}</p>
          <nav className="services-navigation" aria-label={copy.jumpLabel}>
            {copy.services.map((service) => <a key={service.id} href={`#${service.id}`}><span>{service.number}</span>{service.short}</a>)}
          </nav>
        </div>
      </section>

      <div className="services-list" aria-label={copy.detailsLabel}>
        {copy.services.map((service) => <section className="services-feature" id={service.id} key={service.id} aria-labelledby={`${service.id}-title`}>
          <div className="services-container services-feature__grid">
            <div className="services-feature__art" aria-hidden="true"><span className="services-feature__art-ring" /><span className="services-feature__art-symbol">{service.symbol}</span><span className="services-feature__art-number">{service.number} / 04</span></div>
            <div className="services-feature__copy">
              <span className="services-feature__number">{service.number} / 04</span>
              <h2 id={`${service.id}-title`}>{service.title}</h2>
              <p>{service.description}</p>
              <ul>{service.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </div>
        </section>)}
      </div>

      <section className="services-partners" aria-labelledby="services-partners-title">
        <div className="services-container services-partners__grid">
          <div><p className="services-kicker">{copy.partnerKicker}</p><h2 id="services-partners-title">{copy.partnerTitle}</h2></div>
          <div><p>{copy.partnerText}</p><small>{copy.partnerNote}</small></div>
        </div>
      </section>

      <section className="services-cta" aria-labelledby="services-cta-title">
        <div className="services-container services-cta__inner"><div><h2 id="services-cta-title">{copy.ctaTitle}</h2><p>{copy.ctaText}</p></div><Link href={`${localPath(locale, "/consultation")}?source=services`} className="services-cta__link">{copy.cta}<span aria-hidden="true">↗</span></Link></div>
      </section>
    </main>
  </SiteShell>;
}
