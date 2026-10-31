# Public site performance

The public HTML uses request-specific CSP nonces and must remain `no-store`.
Do not introduce shared HTML caching without a separate security design. Hashed
Next assets and prepared WebP images retain immutable browser caching.

## Changes (2026-10-31)

- Send only card fields from the home and journal server components to interactive
  client components. Full news paragraphs, sources, SEO metadata and guide bodies
  stay on their reading pages. News image paths are included explicitly.
- Preload the home hero using mutually exclusive media queries and responsive
  image sets. Mobile retains its approved image; desktop retains its own image.
- Use the existing local Vazirmatn files through `next/font/local`. Preload Arabic
  and Latin, preserve their original Unicode ranges and weights, and load the
  extended Latin subset only when needed. No external font service is involved.
- Prepare responsive WebP variants for social banners and the shared consultation
  photo before release, avoiding request-time image processing for those images.
- Disable automatic route prefetching on the repeated news ticker links. Clicking
  still uses Next navigation, without downloading multiple article routes during
  the ticker animation.

## Validation

Run `pnpm test`, `pnpm build`, and browser performance-loading, conversion-responsive
and faq-layout tests against the production build. Performance-loading tests guard
home/journal HTML budgets, font discovery and a single request for the selected
responsive hero in both languages and mobile/desktop sizes.

Before-change production responses: Persian home 364,016 bytes, English home
353,188 bytes, journal 263,425 bytes (uncompressed HTML). Initial optimized local
build: 218,247 / 207,367 / 100,489 bytes respectively. These are payload comparisons,
not claims about Internet latency. Repeat the same browser measurements on the
deployed release before reporting speed improvements.

Server CPU and memory were healthy during the baseline. Avoid increasing resource
limits or adding database indexes without measured contention or slow queries.
Targets for real-user p75 remain LCP <=2.5s, INP <=200ms, CLS <=0.1; laboratory
measurements do not establish real-user percentiles or guarantee every network.
