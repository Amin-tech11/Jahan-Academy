# Blog panel

- Chat: `blog:3900`; branch: `blog`, created from `home-page` at `c23ec86`.
- Run from `frontend`: `node scripts/dev-blog.mjs`. The launcher verifies the branch and binds port 3900 to loopback.
- The existing home-page Articles navigation opens `/fa/articles` (English: `/en/articles`). `/blog` redirects to the Persian journal. `/fa/news` and `/en/news` open the news filter.
- New specific App Router routes override the existing generic archive routes. Header, home page, shared styles, API, authentication and database code are unchanged. Existing article/news detail routes remain available.

## Design and data

References reviewed: https://go2tr.com/mag and https://applyica.com/blog/ . Use their image-led editorial cards, dated entries and type filters as inspiration, with Jahan Academy's own shell, assets, typography and colors.

The panel reuses the three existing bilingual sample posts in `frontend/lib/site-content.ts`; their sample status is visible. This feature does not publish third-party articles or claim to provide a live news feed. CMS connection and editorial publication remain outside this panel's implementation.

Articles and news share one archive ordered by publication timestamp descending by default, with oldest-first sorting, article/news filtering, normalized Persian/English search, empty state and pagination at six entries. Persian dates use the Persian calendar and UTC formatting. Invalid/future publication dates are excluded. The featured section is separate from the sortable archive.

## Validation and security

- Unit tests cover chronological order, equal dates, timezone offsets, type/search composition, Persian character normalization, invalid/future dates, localized dates and detail links.
- Frontend integration checks: refresh port 3900, navigate from Articles, exercise search/filter/order/reset, open a detail, inspect English and mobile layouts.
- Run `pnpm test`, `pnpm typecheck`, `pnpm build`.
- API/permission/schema design and backend integration changes do not apply: the feature reads existing public sample content and performs no writes or authenticated operations.
- React renders text; no HTML injection, external content fetching, dependencies, secrets or permission changes are introduced.
- Feature PR targets `develop` under the repository workflow; the user performs merges. The branch includes inherited home-page work until separately integrated.

## Verified locally

- All 49 frontend tests passed, including five blog tests; production build and TypeScript check passed.
- In-app browser: Articles navigation from home, archive refresh, newest/oldest order, news filter, Persian search with Arabic letter variants, empty/reset state, existing detail route, and English language switch passed.
- At a 390px viewport, the layout has no horizontal overflow, all six journal images loaded, and the news filter remained usable.
- Existing home-page LCP and global smooth-scroll warnings were observed; no browser errors were reported.
