import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlogPage } from "@/components/blog-page";
import { blogCopy } from "@/lib/blog-content";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? pageMetadata(locale, "/articles", `${blogCopy[locale].title} | Jahan Academy`, blogCopy[locale].intro) : {};
}
export default async function ArticlesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BlogPage locale={locale}/>;
}
