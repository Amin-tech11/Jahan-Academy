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

The 30 existing home university records resolve to individual profiles using their existing summaries and photography. Western is an additional sourced reference profile. Other slugs use the existing public university API adapter and its existing fixture fallback. Unknown slugs and unsupported locales render not-found. Missing photos or features have explicit empty states; unpublished facts are omitted. Website links allow only HTTP(S), without URL credentials.

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
