# Destinations overview panel

## Requirement and scope

- Chat: `destinationS:3800`; branch: `destinationS`; base: `home-page` at `c23ec86`.
- General discovery page: `/fa/countries` and `/en/countries`. The separate `destination`
  branch continues to own the redesigned country detail pages. This feature does not merge it.
- Reference reviewed: https://go2tr.com/study (2026-10-03). Use its introduction, country
  cards, guidance, journey and FAQ structure with Jahan Academy's navy/white visual identity.
  Text, company claims, testimonials and media are not copied from the reference.
- Reuse the ten countries, guide URLs, flags and imagery already tracked in this repository.

## Data, API and permission design

- Public, bilingual editorial content lives in `frontend/lib/destinations-overview.ts`.
- Geography and common languages offer orientation; no tuition, visa, funding, eligibility
  promises, rankings or internal program data are introduced.
- Search is local and supports Persian/Arabic character variants, country aliases and English.
  Region selection and query intersect; a clear empty state lets users reset both.
- No new API, authentication, storage, personal data collection, database or migration.
  API/permission implementation and backend tests do not apply to this public static scope.
- Existing assessment and country detail routes are reused. Individual guide redesigns need
  the user-controlled integration of the separate `destination` branch.
- The user approved the shared header and root-route edits. The header includes an all-country
  link in both menu variants. The root redirect applies only when the panel runner sets
  `JAHAN_PANEL=destinationS`, preserving the default home entry in other environments.
- A dedicated static countries route takes precedence over the existing catch-all; deeper
  country paths retain their existing renderer. Styles use a CSS module scoped to this page.

## Feature verification

- Unit tests: country/guide/asset integrity, complete translations, normalized searches,
  aliases, combined filters, empty results and no source mutation.
- Integration: typecheck, all frontend tests and production build; manual browser checks
  on port 3800 after refresh for desktop navigation, mobile, English, search, filters,
  empty-state reset, FAQ interaction, assessment link and existing country detail links.
- Security/code review: static React text rendering, local read-only search, no secrets,
  no `dangerouslySetInnerHTML`, no external tracking or new dependency, native accessible
  inputs/buttons/details, labelled regions and live result count.
- Commit/push/PR and CI results are recorded in the delivery message. The user performs merges.

### Local results (2026-10-03)

- All 47 frontend tests passed; TypeScript and production build passed.
- Root on port 3800 redirected to `/fa/countries`; page refreshed and visually inspected.
- Desktop and 390px mobile layouts, Persian RTL and English LTR after refresh verified.
- Persian search with Arabic `ك`, English search, Oceania filter, combined empty state,
  reset, FAQ expansion, desktop overview link, mobile all-destinations link and menu
  close, country-detail navigation and assessment-form navigation verified in the browser.
- No horizontal page overflow at mobile width. Backend lead submission was not exercised:
  the new panel only links to the existing form and introduces no submission logic.
- Existing shared root-layout behavior retains the previous document-level language during
  a client-side locale switch; the site shell itself has the correct locale and direction.
  A full refresh sets the document language correctly. This predates this panel and is
  outside the approved shared-code changes.

## Start

From this worktree's `frontend` directory, run `pnpm dev:destinations`.
The command verifies the branch before starting Next.js on port 3800.
