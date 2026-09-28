import { notFound } from "next/navigation";
import { RoutedPublicPage } from "@/components/public-page";
import { isLocale } from "@/lib/site-content";

export default async function CatchAllPublicPage({ params }: { params: Promise<{ locale: string; segments: string[] }> }) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) notFound();
  return <RoutedPublicPage locale={locale} segments={segments} source={`/${locale}/${segments.join("/")}`} />;
}
