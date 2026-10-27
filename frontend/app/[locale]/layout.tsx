import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PublicDocument } from "@/components/public-document";
import { isLocale } from "@/lib/site-content";
import { pageMetadata } from "@/lib/site-seo";

export function generateStaticParams() { return [{ locale: "fa" }, { locale: "en" }]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return isLocale(locale) ? pageMetadata(locale, "", "Jahan Academy | جهان آکادمی") : {};
}
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <PublicDocument locale={locale} advertising>{children}</PublicDocument>;
}
