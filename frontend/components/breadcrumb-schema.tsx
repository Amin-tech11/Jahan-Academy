import type { Locale } from "@/lib/site-content";
import { JsonLd } from "./csp-nonce";
import { siteOrigin } from "@/lib/site-seo";

export function BreadcrumbSchema({ locale, items }: { locale: Locale; items: { name: string; path: string }[] }) {
  const trail = [{ name: locale === "fa" ? "جهان آکادمی" : "Jahan Academy", path: "" }, ...items];
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: trail.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${siteOrigin}/${locale}${item.path}` })) };
  return <JsonLd data={schema} />;
}
