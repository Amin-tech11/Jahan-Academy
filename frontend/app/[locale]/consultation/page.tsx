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

  const fa = locale === "fa";
  return <SiteShell locale={locale}><main className="assessment-page">
    <section className="assessment-page__hero" aria-labelledby="consultation-title">
      <div className="assessment-page__hero-inner">
        <div className="assessment-page__hero-content">
          <span className="assessment-page__eyebrow">JAHAN ACADEMY <span aria-hidden="true">/</span> {fa ? "مشاوره تخصصی" : "PERSONAL ADVICE"}</span>
          <h1 id="consultation-title">{fa ? "مسیر بعدی‌تان را با اطمینان انتخاب کنید." : "Choose your next step with confidence."}</h1>
          <p>{fa ? "هر مسیر مهاجرتی از یک گفت‌وگوی دقیق شروع می‌شود. چند دقیقه درباره شرایطتان بگویید تا تیم ما بتواند درخواست شما را بررسی کند." : "Every migration journey begins with a thoughtful conversation. Tell us a little about your situation so our team can review your request."}</p>
          <a className="assessment-page__hero-link" href="#consultation-form">{fa ? "شروع ارزیابی" : "Start your assessment"}<span aria-hidden="true">↗</span></a>
        </div>
        <div className="assessment-page__hero-aside" aria-hidden="true"><span>01 / 03</span><strong>{fa ? "از شرایط شما شروع می‌کنیم" : "It starts with you"}</strong><div className="assessment-page__hero-rule" /><span>{fa ? "یک مسیر، متناسب با هدف شما" : "A route shaped around your goals"}</span></div>
      </div>
    </section>
    <div className="assessment-page__body">
      <aside className="assessment-page__sidebar" aria-label={fa ? "مراحل درخواست" : "Request steps"}>
        <span className="assessment-page__section-kicker">{fa ? "روند مشاوره" : "HOW IT WORKS"}</span>
        <h2>{fa ? "از همین‌جا شروع کنیم" : "Let's begin here"}</h2>
        <p>{fa ? "برای بررسی اولیه، فقط اطلاعات لازم را از شما می‌خواهیم. پس از ثبت، کد پیگیری دریافت می‌کنید." : "We ask only for the details needed for an initial review. You will receive a reference code after submitting."}</p>
        <ol className="assessment-page__timeline">
          <li><span>01</span><div><strong>{fa ? "اطلاعاتتان را ثبت کنید" : "Share your details"}</strong><small>{fa ? "فرم کوتاه روبه‌رو را کامل کنید." : "Complete the short form."}</small></div></li>
          <li><span>02</span><div><strong>{fa ? "درخواست بررسی می‌شود" : "We review your request"}</strong><small>{fa ? "تیم ما شرایط اولیه شما را بررسی می‌کند." : "Our team reviews your initial details."}</small></div></li>
          <li><span>03</span><div><strong>{fa ? "برای ادامه با شما تماس می‌گیریم" : "We get in touch"}</strong><small>{fa ? "درباره گام بعدی گفت‌وگو می‌کنیم." : "We discuss the next step together."}</small></div></li>
        </ol>
        <div className="assessment-page__privacy-note"><span aria-hidden="true">✳</span><p>{fa ? "اطلاعات شما فقط برای بررسی همین درخواست و تماس درباره آن استفاده می‌شود." : "Your information is used only to review and follow up on this request."}</p></div>
      </aside>
      <section className="assessment-page__form-card" id="consultation-form" aria-label={copy.consultationTitle}>
        <div className="assessment-page__form-heading"><span className="assessment-page__section-kicker">{fa ? "ارزیابی اولیه" : "INITIAL ASSESSMENT"}</span><h2>{fa ? "کمی درباره خودتان بگویید" : "Tell us about yourself"}</h2><p>{fa ? "فیلدهای ضروری با * مشخص شده‌اند. تکمیل سایر موارد به ما کمک می‌کند بهتر با شرایط شما آشنا شویم." : "Required fields are marked *. Optional details help us understand your situation."}</p></div>
        <AssessmentForm locale={locale} source={pageUrl} />
      </section>
    </div>
  </main></SiteShell>;
}
