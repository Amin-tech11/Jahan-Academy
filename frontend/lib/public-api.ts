import { fixtureUniversities, type Locale, type UniversityShowcase } from "@/lib/site-content";

type ApiUniversity = { slug: string; name: string; shortDescription?: string; country: { name: string }; city?: { name: string } | null; institutionType?: string | null; foundedYear?: number | null; websiteUrl?: string | null };
const apiBaseUrl = process.env.JAHAN_API_BASE_URL ?? "http://backend:8000/api/v1";
const localize = (value = "") => ({ fa: value, en: value });
const fromApi = (value: ApiUniversity): UniversityShowcase => ({ slug: value.slug, name: localize(value.name), summary: localize(value.shortDescription), country: localize(value.country.name), city: value.city ? localize(value.city.name) : undefined, institutionType: value.institutionType ? localize(value.institutionType) : undefined, foundedYear: value.foundedYear ?? undefined, websiteUrl: value.websiteUrl ?? undefined });

export async function getUniversityShowcases(locale: Locale): Promise<UniversityShowcase[]> {
  try { const response = await fetch(`${apiBaseUrl}/universities?locale=${locale}&limit=12`, { next: { revalidate: 300 } }); if (!response.ok) throw new Error("unavailable"); const payload = await response.json() as { data?: ApiUniversity[] }; return payload.data?.map(fromApi) ?? fixtureUniversities; } catch { return fixtureUniversities; }
}
export async function getUniversityShowcase(slug: string, locale: Locale): Promise<UniversityShowcase | undefined> {
  try { const response = await fetch(`${apiBaseUrl}/universities/${slug}?locale=${locale}`, { next: { revalidate: 300 } }); if (!response.ok) throw new Error("unavailable"); const payload = await response.json() as { data?: ApiUniversity }; return payload.data ? fromApi(payload.data) : undefined; } catch { return fixtureUniversities.find((item) => item.slug === slug); }
}
