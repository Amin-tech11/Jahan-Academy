# About panel

- Chat: `about:4100`
- Branch: `about`, created from `develop` at `4e497a8`
- Isolated checkout: `F:/Jahan Academy/.worktrees/about`
- Preview: `http://localhost:4100/fa/about` and `/en/about`
- Start from `frontend`: `node scripts/dev-about.mjs` (checks the branch and binds loopback port 4100).

The user's October 3, 2026 request establishes this panel mapping and supersedes the inherited home-page chat mapping for this checkout. Do not merge into develop without a separate instruction.

## Requirement and design

Give visitors a bilingual introduction to Jahan Academy, its purpose, values, and approach, with a clear route to the existing consultation page.

References reviewed on October 3, 2026:
- https://go2tr.com/about: section navigation, values, and reasons to trust the organization.
- https://applyica.com/about-us/: prominent photographic introduction, brand narrative, mission, and vision.

The implementation uses Jahan Academy's existing `brand-content.ts` and local campus illustration. The illustration conveys an educational journey; it is not presented as a photograph of company offices or employees. No competitor copy, fabricated statistics, licenses, employee identities, or contact details are included.

## Scope and data/API/permission design

An explicit localized about route overrides the generic catch-all only for `/fa/about` and `/en/about`. Styles use a CSS module. Shared header, footer, existing brand content, and the consultation route are consumed without changes. No new API, persistence, authentication, permissions, dependency, or migration is required. Contact and service links use existing localized routes.

## Verification

- `pnpm typecheck`: passed.
- `pnpm test`: 32 existing tests passed. New unit tests are not applicable: the new page is static server-rendered presentation; disclosures use native HTML details/summary without custom state logic.
- `pnpm build`: passed with the explicit localized about route.
- Browser integration: refresh on port 4100, Persian RTL and English LTR, desktop and 390px mobile viewports, local image loading, section navigation, and FAQ disclosure verified.
- Security/code review: no data collection or external requests added; localized routes reject unsupported locales; no raw HTML injection; no unverified company claims; responsive layout and keyboard focus styles preserved.
- Publication requires approved company facts before adding legal registration, offices, statistics, or named employees.

Root-preview routing and shared panel configuration are pending the explicit approval required by AGENTS.md; the localized about URLs work independently.

## October 6, 2026: reference palette and supplied narrative

- Requirement: apply the previously approved navy/silver palette and replace the about narrative with the user's three complete paragraphs, preserving bold emphasis and omitting chat-only citation markers.
- Palette authority: `DESIGN_SYSTEM.md`, section 2.1. Navy 950/900/800/700: `#071F31`, `#0B2E45`, `#123D59`, `#1B526F`; silver 500/100: `#9FA4AA`, `#EEF0F2`. Neutral surfaces, borders, body text, and focus follow the same reference. Silver is used decoratively, with dark readable text on light surfaces.
- Implementation: panel-scoped CSS variables replace the previous green/gold colors. The shell inherits these variables only inside the about page. `lib/about-content.ts` owns the supplied Persian narrative and its English translation; page metadata uses the revised brand description. Shared brand content, global styles, data, and permissions are unaffected.
- Data/API/permission design and migrations: not applicable to a static content/style edit. New unit tests are not required for this reversible presentation change; the existing 32 tests passed.
- Verification: typecheck and production build passed. HTTP integration on port 4100 passed for both locales, including the full rendered paragraphs, four strong spans, one H1, correct language, and all four core navy/silver values in the delivered CSS. Diff whitespace check passed.
- Security/code review: emphasized text is rendered with React elements, without raw HTML. No external requests or new data collection were introduced.
- Visual refresh limitation: browser automation rejected access to the localhost URL under its security policy. This update has HTTP and build verification, but visual desktop/mobile review after refresh remains unverified.
- Push/PR/CI remain pending the destination authorization requested earlier after automatic approval review rejected the remote push.
