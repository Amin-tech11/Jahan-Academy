import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { localPath, SiteShell } from "@/components/site-shell";
import { ServicesNavigation } from "@/components/services-navigation";
import { isLocale, type Locale } from "@/lib/site-content";

import "../../services.css";

type PageProps = { params: Promise<{ locale: string }> };

const content = {
  fa: {
    title: "خدمات جهان آکادمی",
    jumpLabel: "فهرست خدمات",
    detailsLabel: "جزئیات خدمت",
    services: [
      {
        id: "assessment", short: "بررسی شرایط", title: "بررسی تخصصی شرایط هر متقاضی",
        description: "مسیر تحصیلی با شناخت شما آغاز می‌شود. سوابق تحصیلی، سطح زبان، بودجه و هدف‌های شما را کنار هم می‌گذاریم تا نقطه شروع روشن باشد.",
        points: ["سوابق و مقطع تحصیلی", "سطح زبان و زمان‌بندی", "بودجه و هدف دانشجو"],
        image: "/services/profile-assessment.png", imageAlt: "بررسی سوابق تحصیلی متقاضی در جلسه مشاوره",
      },
      {
        id: "options", short: "پیشنهاد گزینه‌ها", title: "پیشنهاد گزینه‌های مناسب",
        description: "بر پایه شرایط و اولویت‌ها، کشور، دانشگاه و رشته‌های مرتبط را بررسی می‌کنیم؛ از جمله گزینه‌های تحصیل در آلمان، انگلستان، اسپانیا و فنلاند.",
        points: ["بررسی کشور و دانشگاه", "تناسب رشته با هدف", "مقایسه گزینه‌های قابل بررسی"],
        image: "/services/study-options.png", imageAlt: "مقایسه دانشگاه‌ها و گزینه‌های تحصیلی مناسب",
      },
      {
        id: "documents", short: "آماده‌سازی مدارک", title: "نگارش و ویرایش مدارک موردنیاز",
        description: "برای آماده شدن پرونده، در تنظیم و بازبینی رزومه تحصیلی، انگیزه‌نامه و دیگر مدارک موردنیاز همراهتان هستیم.",
        points: ["رزومه تحصیلی", "انگیزه‌نامه", "بازبینی مدارک پرونده"],
        image: "/services/document-preparation.png", imageAlt: "نگارش و بازبینی مدارک پرونده تحصیلی",
      },
      {
        id: "language", short: "پشتیبانی زبان", title: "پشتیبانی در مسیر یادگیری زبان",
        description: "زبان بخشی از برنامه تحصیلی شماست. درباره مسیر یادگیری و امکان استفاده از پلتفرم آموزش انگلیسی Kalum و شرایط تخفیف ویژه راهنمایی می‌کنیم.",
        points: ["بررسی نیاز زبانی", "برنامه‌ریزی برای یادگیری", "آشنایی با Kalum"],
        image: "/services/language-support.png", imageAlt: "جلسه پشتیبانی و برنامه‌ریزی یادگیری زبان",
      },
    ],
    ctaTitle: "مسیر تحصیلی شما از یک گفت‌وگوی دقیق شروع می‌شود.",
    ctaText: "شرایط و هدف خود را با ما در میان بگذارید تا گام بعدی را با هم بررسی کنیم.",
    cta: "شروع گفت‌وگو",
  },
  en: {
    title: "Jahan Academy services",
    jumpLabel: "Explore services",
    detailsLabel: "Service details",
    services: [
      {
        id: "assessment", short: "Your profile", title: "A thoughtful review of your profile",
        description: "Your academic path starts with understanding you. We look at your education, language level, budget, and goals together to establish a clear starting point.",
        points: ["Academic background", "Language level and timeline", "Budget and goals"],
        image: "/services/profile-assessment.png", imageAlt: "An advisor reviewing a student's academic profile",
      },
      {
        id: "options", short: "Suitable options", title: "Options suited to your goals",
        description: "Based on your priorities, we explore relevant countries, universities, and programs, including options in Germany, the UK, Spain, and Finland.",
        points: ["Country and university review", "Program fit", "Comparable options"],
        image: "/services/study-options.png", imageAlt: "Comparing suitable universities and study options",
      },
      {
        id: "documents", short: "Documents", title: "Writing and reviewing documents",
        description: "We help you prepare and review your academic CV, statement of purpose, and other documents needed for your application.",
        points: ["Academic CV", "Statement of purpose", "Application document review"],
        image: "/services/document-preparation.png", imageAlt: "Preparing and reviewing academic application documents",
      },
      {
        id: "language", short: "Language support", title: "Support for your language journey",
        description: "Language learning belongs in your study plan. We can discuss your learning path and access to the Kalum English learning platform, including any available discount terms.",
        points: ["Language needs", "Learning plan", "Introducing Kalum"],
        image: "/services/language-support.png", imageAlt: "A personalized language support session",
      },
    ],
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
          <h1 id="services-title">{copy.title}</h1>
          <ServicesNavigation label={copy.jumpLabel} services={copy.services.map(({ id, short }) => ({ id, label: short }))} />
        </div>
      </section>

      <div className="services-list" aria-label={copy.detailsLabel}>
        {copy.services.map((service) => <section className="services-feature" id={service.id} key={service.id} aria-labelledby={`${service.id}-title`}>
          <div className="services-container services-feature__grid">
            <div className="services-feature__art">
              <Image className="services-feature__image" src={service.image} alt={service.imageAlt} fill sizes="(max-width: 1000px) calc(100vw - 2rem), 540px" />
            </div>
            <div className="services-feature__copy">
              <h2 id={`${service.id}-title`}>{service.title}</h2>
              <p>{service.description}</p>
              <ul>{service.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </div>
          </div>
        </section>)}
      </div>

      <section className="services-cta" aria-labelledby="services-cta-title">
        <div className="services-container services-cta__inner"><div><h2 id="services-cta-title">{copy.ctaTitle}</h2><p>{copy.ctaText}</p></div><Link href={`${localPath(locale, "/consultation")}?source=services`} className="services-cta__link">{copy.cta}<span aria-hidden="true">↗</span></Link></div>
      </section>
    </main>
  </SiteShell>;
}
