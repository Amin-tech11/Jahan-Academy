import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssessmentForm } from "@/components/assessment-form";
import { SiteShell } from "@/components/site-shell";
import { sourcePageUrl } from "@/lib/consultation";
import { isLocale, siteCopy } from "@/lib/site-content";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `${siteCopy[locale].consultationTitle} | Jahan Academy` };
}

export default async function ConsultationPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const source = typeof query.source === "string" ? query.source : undefined;
  const pageUrl = sourcePageUrl(locale, source);
  const copy = siteCopy[locale];

  return <SiteShell locale={locale}><main className="assessment-page">
    <section className="assessment-page__hero" aria-labelledby="consultation-title">
      <div className="assessment-page__hero-content">
        <h1 id="consultation-title">📑 {locale === "fa" ? "فرم ارزیابی اولیه" : "Initial assessment form"}</h1>
        <p>{locale === "fa" ? "برای تحقق رویاهایتان، در تمام مسیر مهاجرت همراه و پشتیبان شما خواهیم بود…" : "We will support you throughout your journey toward your goals."}</p>
      </div>
      <span className="assessment-page__wordmark" aria-hidden="true">JAHAN ACADEMY</span>
    </section>
    <section className="assessment-page__body" aria-label={copy.consultationTitle}>
      <div className="assessment-page__introduction">
        <p>{locale === "fa" ? "انتخاب مسیر مناسب برای مهاجرت، تحصیل یا سرمایه‌گذاری بین‌المللی، یکی از مهم‌ترین تصمیمات زندگی است و به بررسی دقیق شرایط فردی و اهداف بلندمدت نیاز دارد. در جهان آکادمی شرایط و خواسته‌های شما را بررسی می‌کنیم تا مسیر مناسبی را پیشنهاد دهیم." : "Choosing a path for migration, international study or investment is an important decision. We review your circumstances and goals to recommend a suitable route."}</p>
        <p>{locale === "fa" ? "لطفاً فرم زیر را تکمیل کنید تا کارشناسان ما پس از بررسی اطلاعات، با شما تماس بگیرند. اگر هنوز مطمئن نیستید کدام خدمات برای شما مناسب‌تر است، گزینه «نیاز به مشاوره دارم» را انتخاب کنید." : "Please complete the form so our advisers can review your information and contact you. If you are unsure which service fits, choose the consultation option."}</p>
        <p>{locale === "fa" ? "از همراهی و اعتماد شما سپاسگزاریم. 🙏" : "Thank you for your trust. 🙏"}</p>
      </div>
      <AssessmentForm locale={locale} source={pageUrl} />
    </section>
  </main></SiteShell>;
}
