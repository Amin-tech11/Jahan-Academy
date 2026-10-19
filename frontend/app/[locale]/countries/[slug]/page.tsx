import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DestinationPage } from "@/components/destination-page";
import { destinations, destinationConsultationHref, findDestination } from "@/lib/destination-content";
import { destinationFaqs } from "@/lib/destination-faqs";
import { homeUniversities } from "@/lib/home-universities";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";
import { countryTitle } from "@/lib/seo-copy";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return destinations.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const destination = findDestination(slug);
  if (!isLocale(locale) || !destination) return {};
  return pageMetadata(locale, `/countries/${slug}`, countryTitle(locale, destination.name[locale]), destination.tagline[locale]);
}

export default async function CountryPage({ params }: Props) {
  const { locale, slug } = await params;
  const destination = findDestination(slug);
  if (!isLocale(locale) || !destination) notFound();
  return <><BreadcrumbSchema locale={locale} items={[{ name: locale === "fa" ? "مقصدهای تحصیلی" : "Study destinations", path: "/countries" }, { name: destination.name[locale], path: `/countries/${slug}` }]} /><DestinationPage key={`${locale}:${slug}`} locale={locale} destination={destination}
    universities={homeUniversities.filter(university => university.country === slug)}
    relatedDestinations={destinations.filter(item => item.slug !== slug).map(({ slug, name }) => ({ slug, name }))}
    faqs={destinationFaqs[slug] ?? []}
    consultation={destinationConsultationHref(locale, slug)} /></>;
}
