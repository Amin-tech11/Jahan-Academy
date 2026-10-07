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

## Visible-section navigation — 2026-10-04

The active pill now represents the guide section occupying the largest visible pixel area below the fixed header and sticky title/navigation. All sections are measured together on scroll, viewport resize and layout resize, with work coalesced into animation frames. Equal-area ties preserve the current option; no visible guide section clears the selection. Clicking an anchor no longer forces a selection ahead of the actual scroll position. Observers, event listeners and pending frames are released on cleanup and restarted for country/language changes.

No data/API/permission changes are required. Added six regression tests covering visible-area dominance over intersection ratio, sticky occlusion, offscreen sections, ties, scrolling in both directions, empty viewports, resize/layout updates, frame coalescing, cleanup and ResizeObserver fallback. All 42 frontend tests, production build/TypeScript and 20 route smoke checks pass. Refreshed localhost:3700 desktop/mobile browser checks confirm dominance at a two-section boundary, reverse scrolling, anchor navigation, neutral options above/below the guide and English/Persian behavior. Code/security review confirms page-scoped DOM queries, no new dependencies or external data flow.

## Flag-filled country titles — 2026-10-04

The hero country name now clips the country's flag artwork into its letters in both Persian and English, replacing the earlier single-color accent. Germany shows horizontal black/red/gold bands; all ten destinations use their own full flag pattern. Destination-only SVG variants remove the circular badge mask and stretch across the lettering; original circular icons remain unchanged. A fine dark stroke defines white and yellow areas on the light canvas. Unsupported text-clipping browsers retain the solid accent, and forced-colors mode uses system text colors. The country name remains real, selectable heading text.

No data/API/permission changes or new behavior tests are needed for this presentation change. Extended the existing asset-coverage test to require each country's word flag. All 42 frontend tests, production build/TypeScript and 20 route integration checks pass. Refreshed localhost:3700 browser previews confirm Germany, Canada, Sweden and Italy patterns, Persian mobile Germany and the long English United Kingdom title without horizontal overflow. Code/security review confirms local SVG-only artwork, no external requests or dependencies and destination-scoped CSS.

## Student-life content refresh — 2026-10-04

Removed the student-life eyebrow, photo caption badge and city callout from both locales. The section heading and photo remain. Replaced all ten short city-focused blurbs with original Persian/English summaries of student routines, community, leisure and accommodation, based on national education portals and university guidance. Sources and claim mappings are recorded in [DESTINATION_STUDENT_LIFE_SOURCES.md](DESTINATION_STUDENT_LIFE_SOURCES.md). Removed the unused caption/city-callout styles.

Data/API/permission design and new unit tests do not apply to this static copy/layout edit. The existing 42 frontend tests, production build/TypeScript and route smoke checks pass. An additional read-only check verified the exact localized summaries and all requested removals on every one of the 20 routes. Refreshed localhost:3700 desktop/mobile checks verify readable content and preserved guide navigation. Code/content/security review confirms destination-only changes, original paraphrases, no new dependencies or runtime external requests, and no new financial, immigration or employment-rights claims.

## Country-specific cost and planning section — 2026-10-04

Removed the planning eyebrow and replaced the generic three-card layout with a white rounded editorial section matching the supplied reference: local university photography beside a heading, country-specific summary and four checked topics. On mobile, text comes first and the image follows. The bilingual planning content covers tuition, everyday expenses, initial costs and funding/budget management for all ten destinations. Sources, figure scopes and review date are recorded in [DESTINATION_PLANNING_SOURCES.md](DESTINATION_PLANNING_SOURCES.md). Published cost ranges retain their currencies, periods and relevant student categories; the page identifies them as estimates requiring current institution/accommodation confirmation.

Data design adds five required localized planning fields per destination; no API, permission, shared-code or dependency changes are needed. Extended the existing bilingual-content completeness test. All 42 frontend tests, production build/TypeScript and 20 route smoke checks passed. A separate read-only integration check verified all five text fields, four list items, photo and absent eyebrow in every localized planning section. Refreshed localhost:3700 desktop and Persian/English mobile previews confirm responsive layout, readable text, correct section navigation and no horizontal overflow. Content/security review confirms original summaries, no runtime external requests, and no invented national budgets or guarantees of aid.

## Country-specific admission and visa section — 2026-10-04

Removed the visa eyebrow and replaced the generic numbered steps with a white rounded editorial card. Local destination photography stays physically on the left and copy on the right in both locales; mobile presents text above the image. Each of the ten countries now has an original bilingual summary plus admission/enrolment, documents/preparation and visa/residence topics. Official sources and claim mapping are recorded in [DESTINATION_VISA_SOURCES.md](DESTINATION_VISA_SOURCES.md). Copy preserves nationality/programme-dependent conditions and distinguishes institution-led applications, entry visas and residence permits where relevant.

Data design adds four required localized visa fields per destination. No API, permission, shared-code or dependency changes are needed. Reused the existing checked-list styling under a descriptive name and removed unused numbered-step CSS. Extended the existing content-completeness test; new behavioral unit tests are unnecessary for static copy/layout. All 42 frontend tests, production build/TypeScript and 20 route smoke checks passed. A separate integration check verified every localized field, three topics, one image and absent eyebrow on all 20 routes. Refreshed localhost:3700 desktop and mobile checks in both locales confirm the requested physical column order, responsive stacking, selected visa navigation and no horizontal overflow. Content/security review confirms original paraphrases, no immigration outcome guarantees, no runtime external requests and no unrelated changes.

## Multi-photo destination collages — 2026-10-04

Replaced single images with responsive, rounded multi-photo compositions inspired by the supplied reference screenshots. All ten destinations have distinct hero, academics, life, planning and visa compositions combining local country/campus assets with five newly generated illustrative student photographs. Each university card keeps its own campus image as the larger of two tiles. Visa imagery remains physically left of the text. Removed the superseded hero overlay and unused single-photo CSS. Generated assets are stored locally as WebP (approximately 641 KiB total), with provenance in frontend/public/destinations/collage/SOURCES.md. No reference-site pixels were extracted.

Data design is a destination-only typed collage mapping and reusable presentation component. No API, permission, shared-code or dependency changes are required. Extended existing asset coverage to check all five compositions per country, three different photos, matching country context, local assets and bilingual alt text. The test caught and corrected a duplicate Sweden hero image. All 42 frontend tests, production build/TypeScript and 20 route checks pass. Additional integration checks confirm five editorial collages and three university collages on every localized route. Refreshed desktop/mobile previews in Persian and English verify independent rounded tiles, no horizontal overflow, preserved sticky navigation and visa column placement. Generated scenes are described as illustrative in alt text and are never labelled as photographs of a named institution. Content/security review confirms local assets and no new external requests.

## University photography correction — 2026-10-04

Restored a single institution-specific campus image in every university card, removing the extra illustrative tile. Hero and all four editorial section collages remain. Removed the unused university collage variant and updated image provenance. Data/API/permission design and new unit tests do not apply to this presentation-only correction. All 42 existing frontend tests, production build/TypeScript and 20 route smoke checks pass. Additional integration checks verify exactly one matching campus photo per card, no illustrative imagery inside university sections and five preserved collages on each localized page. Refreshed localhost:3700 confirms the requested appearance. Review found no shared code, dependency or external data-flow changes.

## Larger destination facts and currency symbols — 2026-10-04

Increased all four fact values from 13px to 18px on desktop and from 12px to 16px on mobile, with medium weight and wrapping for longer languages/city lists. Currency now shows the standard narrow symbol from Intl.NumberFormat beside its ISO code, isolated in an LTR inline-flex group so the symbol stays physically on the left in both page directions. No data/API/permission changes or new unit tests are needed for this presentation edit. All 42 existing tests, production build/TypeScript and 20 route smoke checks pass. An additional integration check verifies expected symbols for every country in both languages. Refreshed localhost:3700 confirms GBP ordering and larger desktop values; mobile Finland confirms long text wraps without horizontal overflow. Review found no shared-code, dependency or external-request changes.

## Explore more destinations grid — 2026-10-04

Redesigned the other-destinations section after the supplied reference: centered eyebrow/title, larger white rounded links with subtle shadows, rectangular flags and localized “Study in …” labels. Uses three columns on desktop, two on tablet and one on mobile; each page links to the other nine countries in the current locale. Removed the old compact chip layout and arrows. No data/API/permission changes or new unit tests are needed for this presentation edit. All 42 existing tests, production build/TypeScript and 20 route smoke checks pass. Additional integration checks verify all nine links, matching flags and current-country exclusion on every localized page. Refreshed localhost:3700 desktop Persian and mobile English previews confirm layout and no overflow; clicking Germany confirms correct localized navigation. Review found only destination-scoped code and existing local assets.

## Closing destination consultation — 2026-10-04

Moved the closing consultation section after the other-destinations grid, retaining the exact requested Persian heading and subtitle. The existing local consultation photograph sits on the left beside an overlapping white form card on the right, matching the supplied reference. Mobile stacks the photo and form and uses single-column fields on narrow screens. Both locales and all ten countries use the same destination-scoped component; the homepage component remains unchanged.

Data/API design reuses the existing consultation endpoint and schema, including the current destination name and localized page source. No new permissions, schema, dependencies or shared-code changes are needed. The form validates required fields, mobile and both consents, prevents concurrent duplicate submissions, retains the idempotency key for identical retries, and shows a reference only after API success. Four new behavioral tests cover validation, localized payloads, successful/error responses, retry keys and concurrent submission protection. All 46 frontend tests, production build/TypeScript and 20 route smoke checks pass. Additional read-only integration checks verify placement, exact copy, photograph and form fields on all 20 routes. Refreshed localhost:3700 desktop/mobile checks confirm the requested layout, native required-field validation and no horizontal overflow. Submission tests use a mocked API; no real consultation lead was created. Code/security review confirms destination-only scope and the existing API transport.

## Bound sticky navigation to the country guide — 2026-10-04

Removed the other-destinations eyebrow in both locales. Wrapped the title/navigation and all five guide sections in a flow-root container so native CSS sticky positioning stops at its bottom, immediately before the other-destinations section. The title and tabs scroll away together and no longer follow the consultation section; reverse scrolling restores the sticky guide and current-section highlight. The breadcrumb remains unchanged.

Data/API/permission design and new unit tests do not apply to this CSS/layout correction. All 46 existing frontend tests, production build/TypeScript and 20 route integration checks pass. Refreshed localhost:3700 desktop/mobile checks confirm the navigation bottom is bounded by the other-destinations top, the bar stays at the header offset inside the guide, reverse scrolling reactivates the visa option, and there is no horizontal overflow. Review confirms destination-only changes, no new scroll handlers or dependencies, and preserved section-tracker behavior.

## Destination section motion — 2026-10-04

Added a destination-scoped motion controller matching the current home-page panel's easing, 16px desktop/8px mobile travel, 60ms stagger and restrained hero zoom. All ten countries in both locales animate the introduction, four facts, guide title/tabs, editorial copy, individual collage tiles, university cards, other destinations and closing consultation. The sticky ancestor itself is never transformed, preserving its end boundary and section tracking. Entrances can replay after leaving below the viewport; content already passed above remains readable.

No API, data, permission, dependency or shared-code changes are required. Server HTML stays visible without JavaScript. Reduced-motion preferences disable motion, changes cancel active animations, printing exposes all content, keyboard focus immediately reveals its target, and cleanup releases observers/listeners/animations on country or locale changes. Five new behavioral tests cover restored scroll, replay boundaries, translation-edge stability, keyboard focus, reduced motion, cleanup and physical-side/mobile timing. All 51 frontend tests, production build/TypeScript and 20 route checks pass. Additional integration checks verify motion coverage in every section on all 20 pages and no hidden server markup. Refreshed localhost:3700 desktop/mobile Persian/English previews confirm visible content after scroll/anchor navigation, correct selected tabs and no overflow. Review confirms no animation on guide ancestors, no global scroll handler and no new external requests. Hosted CI remains subject to the previously confirmed account billing restriction.

## Country-specific frequently asked questions — 2026-10-05 (initial version, superseded below)

Added the home-page style accordion between the other-destinations grid and closing consultation. All ten countries have five distinct questions with Persian and English answers, researched from official education and immigration guidance. Each expanded answer includes its supporting source link; the dated source register is DESTINATION_FAQ_SOURCES.md. The section uses the existing destination entrances and stagger, navy active icons, responsive rows and a single open answer. Switching country or language resets the accordion.

Data design uses destination-only static editorial content; no API, schema, permission, dependency or shared-code changes are required for the FAQ feature. Three new tests verify country coverage, bilingual content, source origins and single-answer/accessible-state behavior in both locales. All 54 frontend tests pass. Production build and TypeScript pass. The integration script now verifies FAQ placement, five questions, localized answers, source links and closed/inert initial state across all 20 routes, alongside redirects and 404s. Refreshed localhost:3700 and desktop Persian/mobile English previews confirm layout, Enter/Space and mouse activation, correct sources and no horizontal overflow. Review confirms text is rendered through React, external links use HTTPS and noopener/noreferrer, collapsed source links are inert, and reduced-motion preferences disable accordion transitions. No real consultation request was submitted. CI verification is tracked in PR112.

The previously requested PR112 CI repair also updates the shared workflow's PostgreSQL health options. Run 37285036391 passed Lint and Unit Tests but failed before integration tests because PostgreSQL initialization on the local WSL runner exceeded the original 20 health retries. The service now follows the shared runner configuration: a 120-second startup grace, 30 retries at five-second intervals and a three-second probe timeout. The upstream tmpfs option and readiness command are preserved to keep the PR compatible with the current develop workflow. Health verification remains required, with a bounded wait; no application tests or security gates are bypassed.

Run 37290024955 then passed Lint, Unit Tests and Integration Tests, including migrations. Production image builds passed, but the Compose backend became unhealthy during slow local container startup; Docker/containerd also stopped responding promptly. The destination workflow's service block is aligned with develop commit 7386728 to resolve the overlapping CI configuration changes. The next PR run uses develop's CI-only Compose startup budgets (180-second grace, ten-second interval/timeout, 30 retries), preserving every readiness probe and the full stack/security gates. Shared runner recovery is being handled in the authorized Develop:5000 reference chat; no unrelated services were stopped by this task.

## GO2TR FAQ replacement — 2026-10-05

Replaced the previous FAQ content at the user's request with 46 bilingual summaries of selected questions actually present in the ten GO2TR country study-page FAQ sections. Sweden and Denmark retain the three topics present in their source sections; other guides show five selected topics. The existing placement and home-page accordion appearance remain. Source links now identify GO2TR without calling it an official authority. The dated source register records the exact country URLs and the Danish work-rule correction verified against SIRI; that answer exposes a second verification link.

Data/API/permission design: static destination-only content and one optional verification link; no API, schema, permission, dependency or shared-code changes. Unit coverage checks country/source mapping, bilingual content, variable counts, safe links and the current Danish correction. Integration coverage now handles HTML escaping and verifies localized text, links, counts and FAQ placement on all 20 routes. All 55 frontend tests passed, followed by a successful focused rerun of all four FAQ tests after extending the two-language verification-link assertions. All 20 route checks passed. A refreshed localhost:3700 Persian Germany preview confirms the new questions, expanded answer and GO2TR source. No form was submitted. Production build and latest PR CI are checked before completion.

Content/security review: original short paraphrases preserve selected FAQ facts without reproducing the source pages. Fees and score ranges are attributed estimates rather than universal requirements. No promotional claims about the third-party agency, outdated medical entrance tests, guaranteed visa timing or automatic permanent-residency promises are included. React escapes text; both source links retain HTTPS, noopener/noreferrer, hidden-answer inert behavior and new-window labels. No external content is fetched at runtime.
