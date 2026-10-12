import type { MetadataRoute } from "next";
import { destinations } from "@/lib/destination-content";
import { homeUniversities } from "@/lib/home-universities";
import { services } from "@/lib/site-content";
import { siteOrigin } from "@/lib/site-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Use actual public routes; never include private records, tokens or removed panels.
  const paths = ["", "/services", "/countries", "/universities", "/about", "/privacy", "/consultation", "/free-consultation",
    ...destinations.map(item => `/countries/${item.slug}`), ...homeUniversities.map(item => `/universities/${item.slug}`), ...services.map(item => `/services/${item.slug}`)];
  return [...new Set(paths)].flatMap(path => (["fa", "en"] as const).map(locale => ({ url: `${siteOrigin}/${locale}${path}`, alternates: { languages: { fa: `${siteOrigin}/fa${path}`, en: `${siteOrigin}/en${path}` } } })));
}
