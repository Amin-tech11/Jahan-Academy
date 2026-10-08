import { notFound } from "next/navigation";
import { BlogPage } from "@/components/blog-page";
import { isLocale } from "@/lib/site-content";
export { generateMetadata } from "../articles/page";
export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BlogPage locale={locale} initialType="guide"/>;
}
