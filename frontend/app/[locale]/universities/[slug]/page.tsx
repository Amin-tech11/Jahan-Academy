import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UniversityInfoPage } from "@/components/university-info-page";
import { getUniversityInfo } from "@/lib/get-university-info";
import { isLocale } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const university = await getUniversityInfo(slug, locale);
  return university ? { title: `${university.name[locale]} | Jahan Academy`, description: university.summary[locale] } : {};
}

export default async function UniversityDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const university = await getUniversityInfo(slug, locale);
  if (!university) notFound();
  return <UniversityInfoPage university={university} locale={locale} />;
}
