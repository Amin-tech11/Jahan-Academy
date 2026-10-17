import type { Metadata } from "next";
import type { Locale } from "./site-content";
import { getSeoCopy } from "./seo-copy";

export const siteOrigin = "https://jahanacademi.ir";
const descriptions = {
  fa: "راهنمایی تخصصی جهان آکادمی برای انتخاب مقصد، دانشگاه و رشته، آماده‌سازی مدارک پذیرش و پیگیری مسیر تحصیل بین‌المللی.",
  en: "Jahan Academy helps you explore study destinations and universities, prepare application documents and plan your international study journey.",
};
export function pageMetadata(locale: Locale, path: string, title: string, description = descriptions[locale]): Metadata {
  const copy = getSeoCopy(locale, path);
  title = copy?.title ?? title;
  description = copy?.description ?? description;
  const url = `${siteOrigin}/${locale}${path}`;
  return {
    metadataBase: new URL(siteOrigin), title, description,
    alternates: { canonical: url, languages: { fa: `${siteOrigin}/fa${path}`, en: `${siteOrigin}/en${path}` } },
    openGraph: { type: "website", siteName: "Jahan Academy", title, description, url, locale: locale === "fa" ? "fa_IR" : "en_US", alternateLocale: locale === "fa" ? "en_US" : "fa_IR", images: [{ url: `${siteOrigin}/social-preview.png`, width: 1200, height: 630, alt: "Jahan Academy | جهان آکادمی" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${siteOrigin}/social-preview.png`] },
  };
}
export function organizationSchema() {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": `${siteOrigin}/#organization`, name: "Jahan Academy", alternateName: "جهان آکادمی", url: siteOrigin, logo: `${siteOrigin}/brand/jahan-academy-official.png`, telephone: "+989196017164", sameAs: ["https://t.me/jahanacademy11", "https://www.instagram.com/jahanacademi/", "https://wa.me/989196017164"], address: { "@type": "PostalAddress", addressCountry: "IR", addressLocality: "Tehran", streetAddress: "Unit 3, Floor 3, No. 386, Mirdamad Boulevard, past Nelson Mandela Street" } };
}
