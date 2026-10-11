// Read-only HTTP regression and production payload audit; no browser or form submission.
import { writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { homeUniversities } from '../lib/home-universities.ts';

const base = new URL(process.env.AUDIT_BASE_URL ?? 'http://localhost:5100');
if (!['localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Use a local audit server');
const pending = ['fa', 'en'].flatMap(locale => [
  `/${locale}`, ...homeUniversities.map(u => `/${locale}/universities/${u.slug}`),
]);
const seen = new Set();
const pages = [];
const assets = new Map();
const criticalImages = new Map();
const criticalImageFailures = [];
while (pending.length) {
  const path = pending.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const start = performance.now();
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  const html = await response.text();
  for (const link of html.matchAll(/<link\b[^>]*\bas="image"[^>]*>/gi)) {
    const set = link[0].match(/imageSrcSet="([^"]+)"/i)?.[1];
    if (!set) continue;
    for (const candidate of new Set(set.split(", ").map(item => item.split(" ")[0].replaceAll("&amp;", "&")))) {
      if (!candidate.startsWith("/hero-assets/")) {
        criticalImageFailures.push({ path, image: candidate, reason: "Critical image still needs request-time processing" });
        continue;
      }
      if (criticalImages.has(candidate)) continue;
      const image = await fetch(new URL(candidate, base));
      const bytes = (await image.arrayBuffer()).byteLength;
      const cache = image.headers.get("cache-control") ?? "";
      criticalImages.set(candidate, { status: image.status, bytes, cache });
      if (image.status !== 200 || !image.headers.get("content-type")?.includes("image/webp") || !cache.includes("immutable")) {
        criticalImageFailures.push({ path, image: candidate, reason: "Prepared image is unavailable or lacks immutable caching" });
      }
    }
  }
  const ms = Math.round(performance.now() - start);
  const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]))];
  for (const script of scripts) {
    if (!assets.has(script)) {
      const res = await fetch(new URL(script.replaceAll('&amp;', '&'), base));
      const bytes = Buffer.from(await res.arrayBuffer());
      assets.set(script, { status: res.status, bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
    }
  }
  pages.push({ path, status: response.status, ms, htmlBytes: Buffer.byteLength(html), htmlGzipBytes: gzipSync(html).length, jsGzipBytes: scripts.reduce((sum, src) => sum + assets.get(src).gzipBytes, 0), title: html.match(/<title>(.*?)<\/title>/)?.[1] });
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), base);
    if (url.origin === base.origin && /^\/(fa|en)(\/|$)/.test(url.pathname) && !seen.has(url.pathname)) pending.push(url.pathname);
  }
}
const failures = pages.filter(p => p.status !== 200 || !p.title);
// Detect accidentally shipping the complete country catalog in each detail bundle.
// Set against a baseline from the same bundler; webpack and Turbopack split chunks differently.
const budget = Number(process.env.AUDIT_MAX_DESTINATION_JS_GZIP_BYTES ?? 240000);
if (!(budget > 0)) throw new Error('Invalid JavaScript budget');
const budgetFailures = pages.filter(p => p.jsGzipBytes > budget);
const result = { base: base.origin, createdAt: new Date().toISOString(), pages, assets: Object.fromEntries(assets), criticalImages: Object.fromEntries(criticalImages), criticalImageFailures, failures, budgetFailures };
await writeFile(process.env.AUDIT_OUTPUT ?? 'site-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ pages: pages.length, failures, budgetFailures, slowest: [...pages].sort((a,b)=>b.ms-a.ms).slice(0,5), largestJs: [...pages].sort((a,b)=>b.jsGzipBytes-a.jsGzipBytes).slice(0,5) }, null, 2));
if (failures.length || budgetFailures.length || criticalImageFailures.length || [...assets.values()].some(a => a.status !== 200)) {
  console.error(JSON.stringify({ criticalImageFailures }));
  process.exitCode = 1;
}
