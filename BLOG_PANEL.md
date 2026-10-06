# Blog panel

- Chat: `blog:3900`; branch: `blog`, created from `home-page` at `c23ec86`.
- Run from `frontend`: `node scripts/dev-blog.mjs`. The launcher verifies the branch and binds port 3900 to loopback.
- The existing home-page Articles navigation opens `/fa/articles` (English: `/en/articles`). `/blog` redirects to the Persian journal. `/fa/news` and `/en/news` open the news filter.
- New specific App Router routes override the existing generic archive routes. Header, home page, shared styles, API, authentication and database code are unchanged. Existing article/news detail routes remain available.

## Design and data

References reviewed: https://go2tr.com/mag and https://applyica.com/blog/ . Use their image-led editorial cards, dated entries and type filters as inspiration, with Jahan Academy's own shell, assets, typography and colors.

The panel reuses the three existing bilingual sample posts in `frontend/lib/site-content.ts` and three original bilingual sample guides in `frontend/lib/blog-guides.ts`; their sample status is visible. Guides have dedicated `/fa/guides/{slug}` and `/en/guides/{slug}` reading pages. `/fa/guides` and `/en/guides` open the guide filter. This feature does not publish third-party articles or claim to provide a live news feed. CMS connection and editorial publication remain outside this panel's implementation.

The October 6 update follows the `universities-page` panel: the same existing campus hero asset is copied to `public/blog/classical-campus.png`, with a full-width wordmark, navy/neutral palette, section navigation, guide cards, accordion FAQ and consultation section. The sticky navigation measures the actual header and its own height; the active link follows visible section area, and all observers/listeners are cleaned up. Navigation stops before consultation. Existing shared `HomeFaq` and `ConsultationForm` components are reused without edits. The consultation form uses its existing API and records the journal source; backend availability is required to submit requests.

Articles and news share one archive ordered by publication timestamp descending by default, with oldest-first sorting, article/news filtering, normalized Persian/English search, empty state and pagination at six entries. Persian dates use the Persian calendar and UTC formatting. Invalid/future publication dates are excluded. The featured section is separate from the sortable archive.

## Validation and security

- Unit tests cover chronological order, equal dates, timezone offsets, type/search composition, Persian character normalization, invalid/future dates, localized dates and detail links.
- Frontend integration checks: refresh port 3900, navigate from Articles, exercise search/filter/order/reset, open a detail, inspect English and mobile layouts.
- Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
- API/permission/schema changes do not apply: editorial content remains public sample data; the consultation section reuses the existing public form and consent/validation flow. No new backend operations are introduced.
- React renders text; no HTML injection, external content fetching, dependencies, secrets or permission changes are introduced.
- Feature PR targets `develop` under the repository workflow; the user performs merges. The branch includes inherited home-page work until separately integrated.

## Verified locally

- All 50 frontend tests passed, including six blog tests; production build and TypeScript check passed.
- In-app browser: Articles navigation from home, archive refresh, newest/oldest order, news filter, Persian search with Arabic letter variants, empty/reset state, existing detail route, and English language switch passed.
- At a 390px viewport, the layout has no horizontal overflow, all six journal images loaded, and the news filter remained usable.
- Existing home-page LCP and global smooth-scroll warnings were observed; no browser errors were reported.
- October 6: refreshed the archive, verified independent guide filtering and oldest-first dates, read a guide, expanded FAQ, and confirmed the active navigation follows FAQ with its top exactly aligned to the header bottom. At 390px, navigation aligns below the header, the hero loads, no horizontal page overflow occurs, and guide filtering remains usable. The English guide archive lists all three localized guides. Live consultation submission was not attempted because it would create a real lead and the local backend is not configured.
