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

## Official palette redesign — 2026-10-04

The destination CSS module follows the current home-page palette in `frontend/app/home.css`: navy `#123B78`, silver `#AEB7C2`, canvas `#F7F8FA`, white `#FFFFFF`, text `#202833`, muted text `#66717F` and borders `#D6DCE4`.

- **60% background:** light neutral canvas across the hero, section spacing and university/planning areas.
- **30% content:** white fact panel, academic/student-life sections, university and planning cards, admission panel and closing callout.
- **10% emphasis:** navy primary actions, destination name, selected-section indicator and links; silver for decorative details. Photography, flags and university logos retain their original colors. These percentages describe visual hierarchy, not an exact pixel quota at every viewport.

The previous bright-blue/teal accents and large dark closing banner are replaced with the official neutral/brand roles. Heading/body text remains charcoal; secondary text uses the accessible muted token. Palette variables are scoped with `.site:has(> .page)` inside the destination CSS module, so no shared stylesheet or other panel is changed.

No data/API/permission design changes or new unit tests are needed for this visual-only update. Existing 36 frontend tests, production build/TypeScript and the 20-route integration smoke check pass. Text contrast checks pass AA for normal text: charcoal/white 14.86:1, charcoal/canvas 13.99:1, muted/white 4.96:1, muted/canvas 4.67:1, navy/white 10.92:1 and navy/canvas 10.28:1. Silver is decorative, not a text color. Browser verification covers refreshed desktop/mobile layouts, RTL/LTR, country switching, selected navigation and search states.
