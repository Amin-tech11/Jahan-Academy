# Destination panel

- Chat: `destination:3700`; branch: `destination`; port: `3700`.
- Start from `frontend`: `pnpm dev:destination` (checks the branch and binds loopback).
- The isolated preview redirects `/` to `/fa/countries/canada`. Normal site startup and production retain the existing home page.
- Guides: `/{fa|en}/countries/{slug}` for the ten countries already exposed in site navigation. The existing destination menu links directly to these routes.

## Requirement and design

Country selection must change the guide, images, currency, cities, university cards and official information source. Direct links and refreshes must retain the selected country and language. Unknown country and language routes return 404.

The layout takes inspiration from https://www.applyboard.com/canada#canada-academics: destination introduction, anchor navigation, education section, university cards, student life and next steps. Copy and layout are adapted to Jahan Academy in Persian RTL and English LTR. Existing local photography and university assets are reused; see `frontend/public/universities/SOURCES.md` for university image provenance.

## Data / API / permission design

Public introductory content lives in `frontend/lib/destination-content.ts`. Existing public university showcase data is filtered by country. No new API, database migration, authentication or permission changes are required. No personal data is collected on this page. Consultation links use the existing flow, preserving country/university context in the `source` query parameter.

No programme availability, price, admission eligibility or visa outcome is claimed. Country-specific official portals are provided for current requirements. This is an introductory guide, not a live course catalogue. The two shared configuration files (`frontend/package.json`, `frontend/next.config.ts`) were explicitly approved by the user; other panel implementations are unchanged.

## Validation

- `pnpm test`: includes destination coverage, bilingual content, local asset availability, university-country associations and invalid keys.
- `pnpm typecheck` and `pnpm build`.
- With preview running: `node scripts/check-destination.mjs` validates root redirect, all 20 locale/country routes, guide sections, official links and invalid routes.
- Browser: refresh, destination selection, locale switch, section navigation, university search/empty state and narrow viewport.
- Security review: public static data, validated route allowlist, React-escaped content, HTTPS official sources, safe external links, no new mutation surface.
- Backend-specific local tests/migrations are not applicable: backend code and contracts are unchanged. Repository CI still runs its standard checks.
