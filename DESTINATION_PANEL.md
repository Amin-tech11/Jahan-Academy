# Destination panel

- Chat: `destination:3700`; branch: `destination`; port: `3700`.
- Start from `frontend`: `pnpm dev:destination` (checks the branch and binds loopback).
- The isolated preview redirects `/` to `/fa/countries/canada`. Normal site startup and production retain the existing home page.
- Guides: `/{fa|en}/countries/{slug}` for the ten countries already exposed in site navigation. The existing destination menu links directly to these routes.

## Requirement and design

Country selection must change the guide, images, currency, cities, university cards. Direct links and refreshes must retain the selected country and language. Unknown country and language routes return 404.

The layout takes inspiration from https://www.applyboard.com/canada#canada-academics: destination introduction, anchor navigation, education section, university cards, student life and next steps. Copy and layout are adapted to Jahan Academy in Persian RTL and English LTR. Existing local photography and university assets are reused; see `frontend/public/universities/SOURCES.md` for university image provenance.

## Data / API / permission design

Public introductory content lives in `frontend/lib/destination-content.ts`. Existing public university showcase data is filtered by country. No new API, database migration, authentication or permission changes are required. No personal data is collected on this page. Consultation links use the existing flow, preserving country context in the `source` query parameter.

No programme availability, price, admission eligibility or visa outcome is claimed. This is an introductory guide, not a live course catalogue. The two shared configuration files (`frontend/package.json`, `frontend/next.config.ts`) were explicitly approved by the user; other panel implementations are unchanged.

## Validation

- `pnpm test`: includes destination coverage, bilingual content, local asset availability, university-country associations and invalid keys.
- `pnpm typecheck` and `pnpm build`.
- With preview running: `node scripts/check-destination.mjs` validates root redirect, all 20 locale/country routes, guide sections and invalid routes.
- Browser: refresh, destination selection, locale switch, section navigation and narrow viewport.
- Security review: public static data, validated route allowlist, React-escaped content, no new mutation surface.
- Backend-specific local tests/migrations are not applicable: backend code and contracts are unchanged. Repository CI still runs its standard checks.

## Official palette redesign — 2026-10-04

The destination CSS module follows the current home-page palette in `frontend/app/home.css`: navy `#123B78`, silver `#AEB7C2`, canvas `#F7F8FA`, white `#FFFFFF`, text `#202833`, muted text `#66717F` and borders `#D6DCE4`.

- **60% background:** light neutral canvas across the hero, section spacing and university/planning areas.
- **30% content:** white fact panel, academic/student-life sections, university and planning cards, admission panel and closing callout.
- **10% emphasis:** navy primary actions, destination name, selected-section indicator and links; silver for decorative details. Photography, flags and university logos retain their original colors. These percentages describe visual hierarchy, not an exact pixel quota at every viewport.

The previous bright-blue/teal accents and large dark closing banner are replaced with the official neutral/brand roles. Heading/body text remains charcoal; secondary text uses the accessible muted token. Palette variables are scoped with `.site:has(> .page)` inside the destination CSS module, so no shared stylesheet or other panel is changed.

No data/API/permission design changes or new unit tests are needed for this visual-only update. Existing 36 frontend tests, production build/TypeScript and the 20-route integration smoke check pass. Text contrast checks pass AA for normal text: charcoal/white 14.86:1, charcoal/canvas 13.99:1, muted/white 4.96:1, muted/canvas 4.67:1, navy/white 10.92:1 and navy/canvas 10.28:1. Silver is decorative, not a text color. Browser verification covers refreshed desktop/mobile layouts, RTL/LTR, country switching, selected navigation and search states.

## Content simplification — 2026-10-04

Removed the requested introductory and section eyebrows, hero guidance note, secondary discovery links, university search/count and per-university consultation actions, official destination link and visible country-selector label in both languages. Country selection retains its accessible name. University cards and primary consultation actions remain. Gray section separators and outlines around the large content sections are removed; the official palette and selected navigation indicator remain.

This is a destination-template and stylesheet change only. Data/API/permission design and new unit tests do not apply: no data contract or backend behavior changes. The route smoke check no longer expects a removed official link. Validation passed: 36 frontend tests, production build including TypeScript, all 20 locale/country routes and invalid-route checks. Refreshed desktop and mobile previews confirm removed content, borderless section boundaries, three university cards, working country/language selection and no horizontal overflow. Security/code review found no new data collection or mutation surface.

## Destination facts reference card — 2026-10-04

The four destination facts follow the supplied visual reference: one rounded white card with a subtle border and shadow, four equal centered columns, navy outline icons, bold labels and muted values. Desktop columns have inset vertical dividers; mobile uses a two-by-two grid with correctly placed row/column dividers in both directions. Country-specific language, currency and city values remain unchanged. A semantic description list connects each label to its value; decorative SVG icons are hidden from assistive technology.

Changes are limited to the destination component and CSS module. Data/API/permission design and new unit tests are not applicable to this presentation-only change. Validation passed: all 36 existing frontend tests, production build/TypeScript and the 20-route integration smoke check. Refreshed localhost:3700 desktop and mobile previews confirm the reference layout, Persian/English text, Canada/Germany values and no horizontal overflow. Code/security review confirms no shared code changes, new dependencies or new data flow.

## Pill navigation reference — 2026-10-04

The guide navigation follows the supplied services-panel reference: a white rounded track, equal-width desktop options, subtle border/shadow and a navy active pill with white text. The centered heading reads “۵ دلیل شگفت‌انگیز برای تحصیل در [country]” in Persian and “5 Incredible Reasons to Study in [country]” in English. It names the navigation through aria-labelledby. Existing section anchors, scroll tracking and sticky positioning remain; mobile options scroll within the track and keyboard focus has an inset outline.

Data/API/permission design and new unit tests do not apply to this presentation-only change. All 36 existing frontend tests, production build/TypeScript and the 20-route integration check pass. Refreshed localhost:3700 previews confirm desktop/mobile rendering, active-state changes, section targets below the sticky bar, no page overflow and localized Canada/Germany headings. Code/security review confirms destination-only changes with no new dependencies or data flows.

## Sticky guide heading — 2026-10-04

The localized guide heading now shares the sticky wrapper with the pill navigation, keeping both below the site header while scrolling. Section scroll margins account for the taller wrapper, including a wrapped mobile heading. This changes only destination JSX/CSS; data/API/permission design and new unit tests do not apply. Code review found no new data flows or dependencies. Validation passed: 36 existing frontend tests, production build/TypeScript and all 20 destination routes. Refreshed localhost:3700 desktop/mobile previews confirm a pinned heading and unobstructed university/visa section targets, with no page overflow.

## University card information order — 2026-10-04

University cards no longer display a country badge on their photos. Identity content follows the requested order: logo, university name, then location. The logo, name and location share left alignment for their original Latin text; localized summaries keep their own reading direction. The logo stays partially over the photo but participates in normal layout so names cannot overlap it.

Data/API/permission design and new unit tests do not apply to this presentation-only change. Existing 36 frontend tests, production build/TypeScript and all 20 destination-route smoke checks pass. Refreshed localhost:3700 desktop/mobile previews verify removed badges, logo/name/location ordering and no horizontal overflow. Code/security review found no shared changes, new dependencies or new data flows.

## Remove duplicate selector and color country title — 2026-10-04

Removed only the standalone country select beside the breadcrumbs, as marked in the user screenshot. The shared header destination menu remains available; its code is unchanged. Removed unused router and select styles. The hero country-name span uses a flag-inspired accent for every supported destination: red for Canada/Denmark, black for Germany, green for Italy, dark red for Netherlands and blue for UK/Australia/New Zealand/Sweden/Finland. Italy uses a deeper green for readability. Other heading words and page colors are unchanged.

Data/API/permission design and new unit tests are not applicable to this destination-only presentation change. Code/security review confirms no shared changes or new data flows. Validation passed: 36 frontend tests, production build/TypeScript and all 20 route checks. Refreshed localhost:3700 previews confirm the missing standalone select, preserved keyboard-accessible header menu and navigation to Italy, Persian/English accents and mobile layout without horizontal overflow. All accents exceed the 3:1 large-heading contrast requirement against the canvas (minimum 4.09:1).

## Remove academic logo strip — 2026-10-04

Removed the three-logo row and “Meet your next campus” caption below the academic photo, exactly as marked in the user screenshot. The academic photo/copy and university-card logos remain. Deleted unused logo-strip CSS. Data/API/permission design and new unit tests do not apply to this small presentation-only deletion. Validation passed: 36 existing frontend tests, production build/TypeScript and 20 destination-route checks. Refreshed localhost:3700 desktop/mobile previews confirm one academic image, no logo strip, preserved card logos and no page overflow. Code/security review found no shared changes or new data flows.
