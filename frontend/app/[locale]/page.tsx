import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { isLocale, siteCopy } from "@/lib/site-content";
import { pageMetadata, websiteSchema } from "@/lib/site-seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "", "Jahan Academy | جهان آکادمی", siteCopy[locale].heroText);
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()).replaceAll("<", "\\u003c") }} /><HomePage locale={locale} /></>;
}
