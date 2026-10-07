import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlogPage } from "@/components/blog-page";
import { blogCopy } from "@/lib/blog-content";
import { isLocale } from "@/lib/site-content";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: `${blogCopy[locale].title} | Jahan Academy`, description: blogCopy[locale].intro } : {};
}
export default async function ArticlesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BlogPage locale={locale}/>;
}
