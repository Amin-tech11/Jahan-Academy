import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConsultationForm } from "@/components/consultation-request-form";
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

  return <SiteShell locale={locale}><main className="consultation-page">
    <section className="shell consultation-page__intro" aria-labelledby="consultation-title">
      <p className="eyebrow">JAHAN ACADEMY · {locale === "fa" ? "مشاوره رایگان" : "FREE CONSULTATION"}</p>
      <h1 id="consultation-title">{copy.consultationTitle}</h1>
      <p>{copy.consultationText}</p>
    </section>
    <section className="shell consultation-page__panel" aria-label={copy.consultationTitle}>
      <div className="consultation-page__steps" aria-label={locale === "fa" ? "مراحل درخواست" : "Request steps"}>
        <div><span>01</span><strong>{locale === "fa" ? "اطلاعات خود را ثبت کنید" : "Share your details"}</strong></div>
        <div><span>02</span><strong>{locale === "fa" ? "کد پیگیری دریافت کنید" : "Receive a tracking code"}</strong></div>
        <div><span>03</span><strong>{locale === "fa" ? "منتظر تماس تیم ما باشید" : "Our team will contact you"}</strong></div>
      </div>
      <ConsultationForm locale={locale} source={pageUrl} />
    </section>
  </main></SiteShell>;
}
