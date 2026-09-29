import { ApiError, apiRequest, type ApiEnvelope } from "@/lib/api-client";
import { fixtureUniversities, type Locale, type UniversityShowcase } from "@/lib/site-content";

type ApiUniversity = { slug: string; name: string; shortDescription?: string; country: { name: string }; city?: { name: string } | null; institutionType?: string | null; foundedYear?: number | null; websiteUrl?: string | null };
const localize = (value = "") => ({ fa: value, en: value });
const fromApi = (value: ApiUniversity): UniversityShowcase => ({ slug: value.slug, name: localize(value.name), summary: localize(value.shortDescription), country: localize(value.country.name), city: value.city ? localize(value.city.name) : undefined, institutionType: value.institutionType ? localize(value.institutionType) : undefined, foundedYear: value.foundedYear ?? undefined, websiteUrl: value.websiteUrl ?? undefined });

export async function getUniversityShowcases(locale: Locale): Promise<UniversityShowcase[]> {
  try { const payload = await apiRequest<ApiEnvelope<ApiUniversity[]>>("/universities", { query: { locale, limit: 12 }, next: { revalidate: 300 } }); return payload.data.map(fromApi); } catch { return fixtureUniversities; }
}
export async function getUniversityShowcase(slug: string, locale: Locale): Promise<UniversityShowcase | undefined> {
  try { const payload = await apiRequest<ApiEnvelope<ApiUniversity>>(`/universities/${encodeURIComponent(slug)}`, { query: { locale }, next: { revalidate: 300 } }); return fromApi(payload.data); } catch (error) { if (error instanceof ApiError && error.status === 404) return undefined; return fixtureUniversities.find((item) => item.slug === slug); }
}
