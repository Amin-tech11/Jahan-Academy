import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialDetail } from "@/components/editorial-detail";
import { blogGuides } from "@/lib/blog-guides";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = blogGuides.find(item=>item.slug===slug);
  if (!guide || !isLocale(locale)) return {};
  return pageMetadata(locale, `/guides/${guide.slug}`, `${guide.title[locale]} | Jahan Academy`, guide.excerpt[locale]);
}
export default async function GuideDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const guide = blogGuides.find(item=>item.slug===slug);
  if (!guide) notFound();
  return <EditorialDetail locale={locale} title={guide.title[locale]} date={guide.date} excerpt={guide.excerpt[locale]} sections={guide.sections[locale]} sources={guide.sources} />;
}
