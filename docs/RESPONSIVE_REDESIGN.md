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

## Remaining acceptance gates

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
