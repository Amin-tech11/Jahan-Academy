import { notFound } from "next/navigation";
import { RoutedPublicPage } from "@/components/public-page";
import { isLocale, services } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

export function generateStaticParams() { return [{ segments: ["privacy"] }, { segments: ["universities"] }, ...services.map(({ slug }) => ({ segments: ["services", slug] }))]; }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; segments: string[] }> }) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) return {};
  const [root, slug] = segments;
  const service = root === "services" && services.find(item => item.slug === slug);
  if (service) return pageMetadata(locale, `/services/${slug}`, `${service.title[locale]} | Jahan Academy`, service.summary[locale]);
  if (root === "universities" && !slug) return pageMetadata(locale, "/universities", locale === "fa" ? "دانشگاه‌های برتر | جهان آکادمی" : "Explore universities | Jahan Academy");
  if (root === "privacy" && !slug) return pageMetadata(locale, "/privacy", locale === "fa" ? "حریم خصوصی | جهان آکادمی" : "Privacy policy | Jahan Academy");
  return {};
}

export default async function CatchAllPublicPage({ params }: { params: Promise<{ locale: string; segments: string[] }> }) {
  const { locale, segments } = await params;
  if (!isLocale(locale)) notFound();
  const service = segments[0] === "services" && services.find(item => item.slug === segments[1]);
  return <>{service && <BreadcrumbSchema locale={locale} items={[{ name: locale === "fa" ? "خدمات" : "Services", path: "/services" }, { name: service.title[locale], path: `/services/${service.slug}` }]} />}<RoutedPublicPage locale={locale} segments={segments} source={`/${locale}/${segments.join("/")}`} /></>;
}
