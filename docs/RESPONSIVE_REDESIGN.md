# Public mobile and tablet redesign

Scope: public templates only, Persian and English. Keep public URLs, content,
API contracts and form validation unchanged. Preview: develop, port 5000.
Desktop presentation starts at 1200 CSS pixels.

## Baseline, 2026-10-15

Captured 13 templates in both languages: home, country index, Germany destination,
university index, Western university profile, services, about, journal, Germany
guide, free consultation, assessment, privacy and a missing public route.

- Desktop: 78 full-page captures at 1280, 1440 and 1920 pixels.
- Initial compact-layout audit: 156 visits at 320, 390, 600, 820, 1024 and 1194.
- No document-level horizontal overflow was detected. Existing ancestor clipping
  means this is not evidence that every descendant is visible.
- Raw local evidence: `.operations-hardening/responsive-baseline/` (ignored).

Observed implementation risks:

1. Header switched to compact navigation at 900px, leaving tablets with desktop
   actions. Section bars use several different hardcoded header offsets.
2. Floating consultation card was enabled at 1024px. Compact pages need a single
   bottom action, suppressed for forms, dialogs and keyboard entry.
3. Page CSS contains independent composition breakpoints. Consultation overlap,
   card counts and hero crops must be checked in each owning component.
4. The university showcase currently has a country filter, not a university search.
   Preserve existing capabilities when adding an apply/reset filter panel.
5. The journey uses a long animated path. Compact layouts need collapsible steps
   while retaining the complete text in HTML.
6. Initial desktop pixel comparison is inconclusive: 44/78 images differed because
   of dynamic/lazy content, entrance timing and development overlays. Do not call
   this a passed visual regression check. Stabilize captures for final acceptance.

## Delivery sequence

First delivery establishes the audit and shared header/action primitives. Continue
with page compositions after the first reviewed release; each later delivery is
an independently reversible develop-to-main PR:

1. Shared shell: measured header, touch dialog, focus restoration, compact bottom
   consultation action, safe-area/content reservation and footer touch targets.
2. Conversion: home, free consultation, assessment and shared consultation blocks;
   compact journey, field errors, dropdown viewport bounds and state preservation.
3. Main templates: destinations, universities/profile, services and about; dynamic
   section offsets, horizontal touch navigation, apply/reset filter and gallery.
4. Content and acceptance: journal/articles/guides, privacy/error pages, image
   sizing, cross-browser tests, stable desktop comparison and performance evidence.

The initial audit has no API, permission, database or migration design changes.
Those stages are not applicable. Integration and accessibility checks do apply
to the shared components, because they render on every public template.

## First delivery validation

- TypeScript: passed.
- Existing frontend unit/integration tests: 204 passed.
- New Chrome journeys: all nine requested compact widths in both languages;
  focus containment and restoration, expandable destinations, Escape, backdrop,
  inline-form suppression, dedicated-form suppression and desktop transition.
- Optimized production build: passed, 123 generated pages.
- Production Chrome: 57 journeys passed (24 new compact navigation journeys plus
  existing FAQ, university navigation, public accessibility and recovery/form tests).
  The development-only recovery-link failure does not reproduce in production;
  the component consumes the URL token in an effect rerun by development Strict Mode.
- CI results must be recorded on the PR, not inferred from local results.

## Released shared shell

PR 159 was approved, merged and deployed at main commit
`9b4e1f9691c34b54912c29431aa96cef4b151070`. Main CI and image publication
completed successfully; the disabled deployment job was skipped, followed by
the approved manual release. Production verification covered 20 localized paths,
compact navigation/focus/action suppression, HTTPS health and anonymous admin
access denial. All five Jahan Academy containers were healthy. A rollback
snapshot and database backup were retained. No unrelated server project was changed.

## Conversion delivery

Home cards and the compact journey now follow the requested width ranges. All
13 journey descriptions remain in the HTML; compact headings expand by touch or
keyboard, while the desktop timeline remains available from 1200px.

Free consultation, assessment and consultation blocks on home, destination index,
country, university index, services, about and journal stack image/form under
1200px. Fields use one column below 768px and two short-field columns above it.
Existing native/custom validation appears beside fields and focuses the first
error within the visible area below sticky navigation. Backend field errors map
to existing controls; request payloads, validation rules, consent requirements,
idempotent retries and separate form routes remain unchanged. No form values
are persisted in browser storage.

Dropdown placement observes visual viewport resize/scroll so an on-screen
keyboard or rotation cannot push the list outside the viewport. The shared
select keeps admin styling intact; compact 16px popup text applies only to
public-site controls. Form submission and select triggers wait for hydration.

Validation so far: TypeScript and optimized production build (123 pages) passed;
207 local unit/integration tests passed (including two preserved, unrelated SEO
tests). All 32 new browser journeys passed in Chromium and WebKit. Firefox
passed 31 in the batch; one browser-context teardown crashed after its assertions,
and that case passed independently. The final chat refinement was checked again
in both engines at 320 and 1194px in both languages (four cases per engine).
The complete optimized production Chromium suite passed all 96 cases, including
FAQ animation, university return navigation, recovery, header and form journeys.

Controlled desktop comparison covered all 78 baseline/candidate pairs (13 public
templates, two languages, widths 1280/1440/1920). Page dimensions matched in all
pairs. After decoding cold lazy images, 65 pairs had no differences above the
8/255 channel threshold; the other 13 had at most 0.031% differing pixels, confined
to image rasterization or isolated edge pixels on visual inspection. There was no
observed desktop layout regression. Dynamic chat messages, news and map frames
were masked in both versions; these captures do not validate their changing
contents. Unrelated paused SEO edits were held constant for this comparison and
are excluded from the delivery commit.
No actual iPhone, iPad or Android device was used. These browser checks are
emulation, not field Core Web Vitals evidence.

## Outstanding acceptance work

Test widths 320, 360, 390, 430, 600, 768, 820, 1024, 1194, 1280, 1440 and 1920,
both locales. Test Chromium, Firefox and WebKit for main template families.
Real iPhone/iPad Safari and Android Chrome checks remain separate from emulation.
Check direct entry and client navigation, especially profile → universities and
FAQ pages, text zoom, reduced motion, focus, keyboard, gallery, map, errors,
network retry, browser Back and no accidental horizontal overflow.

Do not claim field Core Web Vitals from browser emulation. Record laboratory
measurements separately from real-user p75 LCP/INP/CLS. Confirm analytics route
deduplication and absence of form values in analytics requests.

CI success and explicit merge authorization are required before production;
deploy only the resulting main SHA and verify the production routes afterward.
