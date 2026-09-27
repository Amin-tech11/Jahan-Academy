import { notFound } from "next/navigation";
import { HomePage } from "@/components/public-page";
import { isLocale } from "@/lib/site-content";

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage locale={locale} />;
}
