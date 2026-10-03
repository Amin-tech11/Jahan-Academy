import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationPage } from "@/components/destination-page";
import { findDestination } from "@/lib/destination-content";
import { isLocale } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const destination = findDestination(slug);
  if (!isLocale(locale) || !destination) return {};
  return {
    title: `${locale === "fa" ? "تحصیل در" : "Study in"} ${destination.name[locale]} | Jahan Academy`,
    description: destination.tagline[locale],
    alternates: { languages: { fa: `/fa/countries/${slug}`, en: `/en/countries/${slug}` } },
  };
}

export default async function CountryPage({ params }: Props) {
  const { locale, slug } = await params;
  const destination = findDestination(slug);
  if (!isLocale(locale) || !destination) notFound();
  return <DestinationPage key={`${locale}:${slug}`} locale={locale} destination={destination} />;
}
