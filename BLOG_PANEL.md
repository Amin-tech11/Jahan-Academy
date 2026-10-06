# Blog panel

- Chat: `blog:3900`; branch: `blog`, created from `home-page` at `c23ec86`.
- Run from `frontend`: `node scripts/dev-blog.mjs`. The launcher verifies the branch and binds port 3900 to loopback.
- The existing home-page Articles navigation opens `/fa/articles` (English: `/en/articles`). `/blog` redirects to the Persian journal. `/fa/news` and `/en/news` open the news filter.
- New specific App Router routes override the existing generic archive routes. Header, home page, shared styles, API, authentication and database code are unchanged. Existing article/news detail routes remain available.

## Design and data

References reviewed: https://go2tr.com/mag and https://applyica.com/blog/ . Use their image-led editorial cards, dated entries and type filters as inspiration, with Jahan Academy's own shell, assets, typography and colors.

The panel reuses the three existing bilingual sample posts in `frontend/lib/site-content.ts` and three original bilingual sample guides in `frontend/lib/blog-guides.ts`; their sample status is visible. Guides have dedicated `/fa/guides/{slug}` and `/en/guides/{slug}` reading pages. `/fa/guides` and `/en/guides` open the guide filter. This feature does not publish third-party articles or claim to provide a live news feed. CMS connection and editorial publication remain outside this panel's implementation.

The October 6 update follows the `universities-page` panel: the same existing campus hero asset is copied to `public/blog/classical-campus.png`, with a full-width wordmark, navy/neutral palette, section navigation, guide cards, accordion FAQ and consultation section. The sticky navigation measures the actual header and its own height; the active link follows visible section area, and all observers/listeners are cleaned up. Navigation stops before consultation. Existing shared `HomeFaq` and `ConsultationForm` components are reused without edits. The consultation form uses its existing API and records the journal source; backend availability is required to submit requests.

Editorial content is arranged in three independent sections from top to bottom: News, Articles, Guides. Each has its own search, publication order, empty state and pagination at six entries. The section navigation follows the same order. The breadcrumb, featured/mixed archive and FAQ section have been removed. Persian dates use the Persian calendar and UTC formatting. Invalid/future publication dates are excluded.

## Validation and security

- Unit tests cover chronological order, equal dates, timezone offsets, type/search composition, Persian character normalization, invalid/future dates, localized dates and detail links.
- Frontend integration checks: refresh port 3900, navigate from Articles, exercise search/filter/order/reset, open a detail, inspect English and mobile layouts.
- Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
- API/permission/schema changes do not apply: editorial content remains public sample data; the consultation section reuses the existing public form and consent/validation flow. No new backend operations are introduced.
- React renders text; no HTML injection, external content fetching, dependencies, secrets or permission changes are introduced.
- Feature PR targets `develop` under the repository workflow; the user performs merges. The branch includes inherited home-page work until separately integrated.

## Verified locally

- Latest layout revision: after refresh on port 3900, the DOM contains News, Articles, Guides in that order and no breadcrumb or FAQ section. Searching in News does not change the other sections; oldest-first sorting in Guides returns September 15, 16, 17. The mobile layout shows the three section navigation links. All 50 existing frontend tests and TypeScript checks pass; no new API or permission design applies to this layout-only change.

- All 50 frontend tests passed, including six blog tests; production build and TypeScript check passed.
- In-app browser: Articles navigation from home, archive refresh, newest/oldest order, news filter, Persian search with Arabic letter variants, empty/reset state, existing detail route, and English language switch passed.
- At a 390px viewport, the layout has no horizontal overflow, all six journal images loaded, and the news filter remained usable.
- Existing home-page LCP and global smooth-scroll warnings were observed; no browser errors were reported.
- October 6: refreshed the archive, verified independent guide filtering and oldest-first dates, read a guide, expanded FAQ, and confirmed the active navigation follows FAQ with its top exactly aligned to the header bottom. At 390px, navigation aligns below the header, the hero loads, no horizontal page overflow occurs, and guide filtering remains usable. The English guide archive lists all three localized guides. Live consultation submission was not attempted because it would create a real lead and the local backend is not configured.

- Consultation screenshot revision: the blog-specific compact form uses the existing consultation endpoint, mobile normalization, required privacy/contact consent and idempotency key, with the journal source URL. Image-left/card-right overlap, gold free label and mobile stacking follow the supplied reference. No shared component, backend or permission change was needed. Live submission is excluded to avoid creating a real lead.

- Screenshot revision verified after refresh on localhost:3900 at 1280px and 390px: image loaded, no horizontal overflow, mobile fields stack, and all six mandatory fields/consents retain required validation. All 50 tests, TypeScript and production build passed. Dedicated unit tests were unnecessary for the visual rearrangement; existing API/mobile tests cover the reused utilities. Submission/backend integration and remote CI remain unverified.

- Simplified section revision: removed JOURNAL kickers, tagline, result counts, search and publication sort controls from all sections. News, Articles and Guides headings are centered with reference-like spacing; newest-first chronology and pagination remain. Verified after refresh on port 3900: all three centered headings, zero removed controls. 50 tests and typecheck pass. No data/API/permission change or new behavioral unit test applies.

- Reference card revision: all six sample cards now use a rounded 3:2 image with shadow, followed by title, publication date with a gold leading rule and a two-line excerpt. Removed enclosing borders, type badges, arrow overlays and read buttons. Image and title links remain accessible. Author names are unavailable in the source and were not fabricated. Desktop three-column and mobile one-column layouts refreshed on port 3900 without overflow. 50 tests, typecheck and production build pass; no API/permission design or additional behavioral unit tests apply to this presentation change. Remote CI remains pending.

- Consultation typography update: blog-scoped Vazirmatn Variable font, near-navy heading and field labels, muted blue-gray helper/consent text, and a matching blue privacy link. Free text remains gold and submit text white. Verified rendered desktop form at localhost:3900 and computed font/colors; no shared files changed. No automated tests or build were run for this CSS-only request.
