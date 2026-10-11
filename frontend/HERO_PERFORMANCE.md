# Critical image delivery

Critical images use `PreparedImage`, which retains Next Image sizing, preloading,
accessibility and the existing page styles. Known sources use a responsive WebP
loader and bypass the production image optimizer entirely. Other images retain
the normal Next Image loader.

After changing a hero, logo or source image, run:

```sh
node scripts/prepare-hero-images.mjs
```

Commit `lib/hero-image-assets.json` and the referenced files in
`public/hero-assets/` with the source change. The generator preserves aspect ratio,
never upscales, and caps generated widths at 1920 pixels. Content hashes include
the source bytes and encoding version, so replacing an image changes its URL.
Only these hashed assets have year-long immutable caching; mutable source paths
keep their normal cache policy.

Unit tests reject stale hashes, missing assets, incorrect dimensions and loader
selection errors. The production public-route audit checks every image preload
for direct prepared URLs, WebP responses and immutable cache headers. Original
approved images remain available; no artwork or animation is replaced.
