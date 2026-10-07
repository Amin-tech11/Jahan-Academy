import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPage } from "@/components/about-page";
import { brandContent } from "@/lib/brand-content";
import { isLocale } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: locale === "fa" ? "درباره جهان آکادمی | همراه مسیر تحصیل شما" : "About Jahan Academy | Your study journey",
    description: brandContent[locale].intro,
    alternates: { canonical: `/${locale}/about`, languages: { fa: "/fa/about", en: "/en/about" } },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AboutPage locale={locale} />;
}
