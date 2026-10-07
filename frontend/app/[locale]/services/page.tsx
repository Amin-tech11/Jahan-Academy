import { PanelConsultationCallout } from "@/components/panel-consultation-callout";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/site-shell";
import { ServicesConsultationForm } from "@/components/services-consultation-form";
import { ServicesNavigation } from "@/components/services-navigation";
import { ServicesMotion } from "@/components/services-motion";
import { ServicesHero } from "@/components/services-hero";
import { ServicesTitle } from "@/components/services-title";
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
    ctaTitle: "بیایید درباره آینده تحصیلی‌تان گپ بزنیم.",
    ctaText: "از آرزوها و سؤال‌هایتان برای ما بگویید؛ کنار شما هستیم تا قدم بعدی را با خیال راحت‌تر بردارید.",
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
    ctaTitle: "Let's talk about your study dreams.",
    ctaText: "Tell us what's on your mind. We're here to help you take your next step with more confidence.",
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
      <ServicesHero title={copy.title} />

      <ServicesMotion>
      <div className="services-content">
        <section className="services-intro" aria-labelledby="services-title">
          <div className="services-container">
            <ServicesTitle>{copy.title}</ServicesTitle>
            <ServicesNavigation label={copy.jumpLabel} services={copy.services.map(({ id, short }) => ({ id, label: short }))} />
          </div>
        </section>

        <div className="services-container"><PanelConsultationCallout locale={locale} panel="services" /></div>
<div className="services-list" aria-label={copy.detailsLabel}>
          {copy.services.map((service) => <section className="services-feature" id={service.id} key={service.id} aria-labelledby={`${service.id}-title`}>
            <div className="services-container services-feature__grid">
              <div className="services-feature__art">
                <Image className="services-feature__image" src={service.image} alt={service.imageAlt} fill sizes="(max-width: 900px) calc(100vw - 3rem), 600px" />
              </div>
              <div className="services-feature__copy">
                <h2 id={`${service.id}-title`}>{service.title}</h2>
                <p>{service.description}</p>
                <ul>{service.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </div>
            </div>
          </section>)}
        </div>
      </div>

      <section className="services-cta" aria-labelledby="services-cta-title">
        <div className="services-container">
          <div className="services-cta__heading"><h2 id="services-cta-title">{copy.ctaTitle}</h2><p>{copy.ctaText}</p></div>
          <div className="services-cta__layout">
            <div className="services-cta__photo"><Image src="/services/consultation-options/consultation-01.png" alt={locale === "fa" ? "مشاور جهان آکادمی در حال گفت‌وگو با متقاضی" : "A Jahan Academy advisor speaking with an applicant"} fill sizes="(max-width: 900px) 100vw, 600px" /></div>
            <div className="services-cta__card"><ServicesConsultationForm locale={locale} /></div>
          </div>
        </div>
      </section>
      </ServicesMotion>
    </main>
  </SiteShell>;
}
