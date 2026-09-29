import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { isLocale, siteCopy } from "@/lib/site-content";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `Jahan Academy | ${siteCopy[locale].heroTitle.replace(/\s+/g, " ")}`, description: siteCopy[locale].heroText };
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage locale={locale} />;
}
