import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPage } from "@/components/about-page";
import { aboutContent } from "@/lib/about-content";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMetadata(locale, "/about", locale === "fa" ? "داستان جهان آکادمی | همراه مسیر تحصیل شما" : "The Jahan Academy Story | Your study journey", aboutContent[locale].description);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AboutPage locale={locale} />;
}
