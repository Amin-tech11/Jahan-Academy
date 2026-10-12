import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UniversityInfoPage } from "@/components/university-info-page";
import { getUniversityInfo } from "@/lib/get-university-info";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";
import { homeUniversities } from "@/lib/home-universities";

type Props = { params: Promise<{ locale: string; slug: string }> };
export function generateStaticParams() { return homeUniversities.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const university = await getUniversityInfo(slug, locale);
  return university ? pageMetadata(locale, `/universities/${slug}`, `${university.name[locale]} | Jahan Academy`, university.summary[locale]) : {};
}

export default async function UniversityDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const university = await getUniversityInfo(slug, locale);
  if (!university) notFound();
  return <><BreadcrumbSchema locale={locale} items={[{ name: locale === "fa" ? "دانشگاه‌ها" : "Universities", path: "/universities" }, { name: university.name[locale], path: `/universities/${slug}` }]} /><UniversityInfoPage university={university} locale={locale} /></>;
}
