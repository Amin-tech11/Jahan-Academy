import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { blogGuides } from "@/lib/blog-guides";
import { blogCopy, blogDate } from "@/lib/blog-content";
import { isLocale } from "@/lib/site-content";
import "@/app/blog.css";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = blogGuides.find(item=>item.slug===slug);
  return guide && isLocale(locale) ? { title:`${guide.title[locale]} | Jahan Academy`, description:guide.excerpt[locale] } : {};
}
export default async function GuideDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const guide = blogGuides.find(item=>item.slug===slug);
  if (!guide) notFound();
  const copy = blogCopy[locale];
  return <SiteShell locale={locale}><main className="journal-page"><article className="shell journal-guide-detail"><Link href={`/${locale}/articles`}>{copy.back}</Link><header><span className="journal-tag">{copy.guide}</span><h1>{guide.title[locale]}</h1><time dateTime={guide.date}>{blogDate(guide.date,locale)}</time><p>{guide.excerpt[locale]}</p></header>{guide.sections[locale].map((section,index)=><section key={section.title}><span className="journal-guide-number">{index+1}</span><h2>{section.title}</h2><p>{section.body}</p></section>)}<p className="journal-preview-note">{copy.note}</p><Link className="button button-primary" href={`/${locale}/consultation?source=guide:${guide.slug}`}>{copy.consultation}</Link></article></main></SiteShell>;
}
