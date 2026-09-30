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
  const title = locale === "fa" ? "فرم ارزیابی اولیه" : "Initial assessment form";
  return { title: `${title} | Jahan Academy` };
}

export default async function ConsultationPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const source = typeof query.source === "string" ? query.source : undefined;
  const pageUrl = sourcePageUrl(locale, source);
  const fa = locale === "fa";
  return <SiteShell locale={locale}><main className="assessment-page">
    <section className="assessment-page__hero" aria-labelledby="consultation-title">
      <h1 className="assessment-page__wordmark" id="consultation-title" dir="ltr">JAHAN ACADEMY</h1>
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
      <section className="assessment-page__form-card" id="consultation-form" aria-label={fa ? "فرم ارزیابی اولیه" : "Initial assessment form"}>
        <div className="assessment-page__form-heading"><span className="assessment-page__section-kicker">{fa ? "ارزیابی اولیه" : "INITIAL ASSESSMENT"}</span><h2>{fa ? "خوشحال می‌شویم کمی بیشتر با شما آشنا شویم" : "Tell us about yourself"}</h2><p>{fa ? "تکمیل تمامی فیلدهای این فرم برای ثبت درخواست ارزیابی الزامی است." : "All fields in this form must be completed before submitting your assessment request."}</p></div>
        <AssessmentForm locale={locale} source={pageUrl} />
      </section>
    </div>
  </main></SiteShell>;
}
