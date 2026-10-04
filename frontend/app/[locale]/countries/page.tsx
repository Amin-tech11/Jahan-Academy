import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationsOverview } from "@/components/destinations-overview";
import { isLocale } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const fa = locale === "fa";
  return {
    title: fa ? "مقصدهای تحصیلی | جهان آکادمی" : "Study destinations | Jahan Academy",
    description: fa ? "آشنایی با مقصدهای تحصیلی، جست‌وجوی کشورها و راهنمای انتخاب مسیر تحصیل در خارج با جهان آکادمی." : "Explore study destinations, browse countries and plan your next academic step with Jahan Academy.",
  };
}

export default async function CountriesOverviewPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <DestinationsOverview locale={locale} />;
}
