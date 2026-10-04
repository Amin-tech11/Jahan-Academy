# University information panel

- Chat: `university-info:3600`
- Branch: `university-info`, created from `develop` at `4e497a8`
- Checkout: `F:\Jahan Academy\.worktrees\university-info`
- Run from `frontend`: `pnpm dev:university-info`
- Reference: http://localhost:3600/fa/universities/western-university
- English: http://localhost:3600/en/universities/western-university
- Entry cards: http://localhost:3600/fa (university section)

This explicit new-panel request supersedes the inherited home-page chat assignment in AGENTS.md. Never switch the shared root checkout for this panel.

## Scope and data design

Institution identity, real photography, overview, campus features, location and institution facts. Excludes Programs, Scholarships, Services, Cost and Duration, Application Processing Time and Program Levels. Overview/features/location use accessible keyboard-operated tabs. Photos open a native modal with keyboard navigation and Escape dismissal. Catalog cards use normal links with `target="_blank"` and `rel="noopener noreferrer"`.

The 30 home university records and three known public university records have individual bilingual profiles in `frontend/lib/university-info-profiles.ts`. All use the final Western layout: English LTR linked identity, real photography and modal viewer, overview with reasons/notes/life cards, five independently expandable illustrated feature rows, campus map, and institution facts. Western remains the additional reference profile (34 supported profiles in total). Other slugs use the existing public university API adapter and fixture fallback; enrichment never makes an API 404 into a published profile. Unknown slugs and unsupported locales render not-found.

University-specific Top disciplines cards display sourced percentage bars for 23 additional universities, alongside Western. Each new chart shows its observation year, population and source; ten distributions remain unverified and show an explicit unavailable-data message. See UNIVERSITY_INFO_DATA.md for provenance and limitations. Country-specific official guidance replaces blanket work/residence eligibility claims. Institutional admissions, internships and housing are presented as conditions to check, not guaranteed availability. Existing catalog photos/logos are retained; Toronto, TUM and Bologna have new attributed local assets. All 33 additional profiles now have verified city/address, founding year and institution type; Canadian profiles include their DLI. Historical predecessor dates are explained in profile notes. Missing content on future unknown API records still has explicit empty states. Website links allow only HTTP(S), without URL credentials.

API contract, authentication, schema/migration and permission changes do not apply: this is a read-only public frontend using existing data. No new mutation endpoints or personal information collection. No backend changes.

Shared changes explicitly approved by the user: new-tab university links in `home-university-showcase.tsx` and `public-page.tsx`, plus the new launcher mapping in `package.json`, `dev-panel.mjs` and `PANEL_WORKFLOW.md`. Other panel checkouts remain untouched. Links on ports 3100/3400 require the user-controlled integration of this branch before those checkouts gain the feature.

## Verification

- Unit: `pnpm test` (catalog identity/assets, locale paths, missing facts, URL validation).
- Type checking: `pnpm typecheck`.
- Production build: `pnpm build`.
- HTTP integration after starting port 3600: `node scripts/verify-university-info.mjs`.
- Browser: refresh reference route; inspect desktop/mobile, FA/EN, tabs, gallery and new-tab navigation.
- Security review: React text escaping; no raw HTML; no secrets; safe external URLs; no opener access; existing API access boundary unchanged.
- Push/PR target: `develop`; user performs merge. Stop after CI verification.

Local results (2026-10-03): 36 unit tests passed; TypeScript and production build passed. HTTP integration passed for FA/EN Western, all 30 catalog universities, unknown slug and invalid locale. Browser refresh, desktop, 390px mobile, no horizontal overflow, FA/EN switch, RTL keyboard tabs, gallery next/Escape and a real McGill new-tab click passed. Browser console had no errors. A mobile title-wrapping issue was corrected during visual review.

Catalog rollout (2026-10-04): 45 unit tests passed, including coverage of all 33 additional profiles, existing imagery preservation, localized sections, country guidance isolation, safe URLs, unknown-record fallback and no invented distribution statistics. TypeScript and production build passed. The local build used the existing `JAHAN_DEV_PORT=3200` output-directory switch only (no server on 3200), because the running 3600 server holds log files inside `.next`; its generated `next-env.d.ts` change was restored. HTTP checks passed for all 66 additional FA/EN routes, both Western routes and invalid slug/locale boundaries. Browser refresh and interactions passed for McGill, TUM, Toronto and a long Catholic University title at 390px: LTR English identity, independent details, black links, university-specific map, single-photo modal/Escape, local images and no horizontal overflow. Google's embedded map emitted a third-party place-details permission error while the map tiles remained visible; the profile itself rendered correctly. A pre-existing Next image loading hint also appeared. No authentication, API contract, schema or backend changes were needed. Security/code review confirmed local assets, escaped text, fixed map origin and safe external-link handling.

Data completion (2026-10-04): added audited institution facts for all 33 additional profiles and source-backed discipline distributions for 23. Ten distributions remain unavailable; UNIVERSITY_INFO_DATA.md records the exact scope and outstanding research limitations. All 47 unit tests, TypeScript, isolated production build and 68 localized profile HTTP checks plus two not-found boundaries passed. Refreshed browser checks passed for Imperial FA/EN, 390px mobile (no horizontal overflow), percentage bars and source captions, and Adelaide's new-institution history/unavailable-data state. No API, permission, schema or backend design changes apply. Security review confirmed escaped text, safe HTTP(S) source links and preserved external-link isolation. Build output used .next-3200 only; the server remains on 3600.
