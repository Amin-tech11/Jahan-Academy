import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { HomeConsultation } from "@/components/home-consultation";
import { ConsultationFreeText } from "@/components/consultation-form-heading";
import { SiteShell } from "@/components/site-shell";
import { isLocale } from "@/lib/site-content";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ source?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: `${locale === "fa" ? "درخواست مشاوره رایگان" : "Request a free consultation"} | Jahan Academy`,
    description: locale === "fa"
      ? "اطلاعات کوتاهی ثبت کنید تا تیم جهان آکادمی برای هماهنگی مشاوره با شما تماس بگیرد."
      : "Share a few details so the Jahan Academy team can contact you to arrange a consultation.",
  };
}

export default async function FreeConsultationPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { source } = await searchParams;
  const fromHome = source === "home-trust";
  const fa = locale === "fa";

  return <SiteShell locale={locale}><main className="free-consultation-page">
    <div className="shell">
      <header className="free-consultation-page__intro">
        <span className="free-consultation-page__eyebrow">{fa ? "گفت‌وگو از همین‌جا شروع می‌شود" : "Your conversation starts here"}</span>
        <h1><ConsultationFreeText locale={locale} text={fa ? "درخواست مشاوره رایگان" : "Request a free consultation"} /></h1>
        <p>{fa
          ? "چند اطلاعات کوتاه از خودتان ثبت کنید. تیم جهان آکادمی برای هماهنگی زمان مشاوره با شما تماس می‌گیرد."
          : "Share a few details about yourself. The Jahan Academy team will contact you to arrange your consultation."}</p>
      </header>
      <div className="free-consultation-page__layout">
        <div className="free-consultation-page__media">
          <Image src="/home-trust-consultation.png" alt={fa ? "گفت‌وگوی مشاور جهان آکادمی با متقاضیان" : "A Jahan Academy advisor speaking with prospective students"} fill sizes="(max-width: 800px) 100vw, 48vw" priority />
          <div className="free-consultation-page__media-caption">
            <strong>{fa ? "یک قدم تا گفت‌وگو" : "One step from a conversation"}</strong>
            <span>{fa ? "درخواستتان را ثبت کنید؛ برای ادامه با شما تماس می‌گیریم." : "Send your request and we will get in touch about what comes next."}</span>
          </div>
        </div>
        <HomeConsultation locale={locale} sourcePage={fromHome ? `/${locale}` : `/${locale}/free-consultation`} />
      </div>
    </div>
  </main></SiteShell>;
}
