import { cache } from "react";
import { homeUniversities } from "@/lib/home-universities";
import { getUniversityShowcase } from "@/lib/public-api";
import { headerDestinations, type Locale } from "@/lib/site-content";
import { fromCatalog, fromPublicUniversity, westernUniversity } from "@/lib/university-info-model";
import { enrichUniversityInfo } from "@/lib/university-info-profiles";

export const getUniversityInfo = cache(async (slug: string, locale: Locale) => {
  if (slug === westernUniversity.slug) return westernUniversity;
  const catalog = homeUniversities.find((item) => item.slug === slug);
  if (catalog) {
    const country = headerDestinations.find((item) => item.slug === catalog.country);
    return enrichUniversityInfo(fromCatalog(catalog, country ? { fa: country.fa, en: country.en } : { fa: catalog.country, en: catalog.country }));
  }
  const university = await getUniversityShowcase(slug, locale);
  return university ? enrichUniversityInfo(fromPublicUniversity(university)) : undefined;
});
