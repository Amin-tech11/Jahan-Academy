// Prepare responsive critical images before deployment, never during a page request.
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = fileURLToPath(new URL("../", import.meta.url));
const publicDir = path.join(root, "public");
const sources = new Set([
  "/home-hero-campus-v2.png", "/services-hero-interview.png",
  "/home-hero-documentary.png", "/blog/library-hero.webp",
  "/universities/hero/classical-campus.png", "/destinations/world-map-hero-wide.png",
  "/free-consultation.webp", "/home-trust-office-meeting.webp", "/brand/jahan-academy-official.png",
]);
for (const dir of ["journey", "services", "destinations", "destinations/collage", "universities", "university-info"]) {
  for (const item of await readdir(path.join(publicDir, dir), { withFileTypes: true })) {
    if (item.isFile() && /\.(png|jpe?g|webp)$/i.test(item.name) && !/logo/i.test(item.name)) sources.add(`/${dir}/${item.name}`);
  }
}
await mkdir(path.join(publicDir, "hero-assets"), { recursive: true });
const manifest = {};
for (const src of [...sources].sort()) {
  const input = await readFile(path.join(publicDir, src));
  const metadata = await sharp(input).metadata();
  const maximumWidth = Math.min(metadata.width, 1920);
  const widths = [...new Set([480, 768, 1280, maximumWidth].filter(width => width <= maximumWidth))].sort((a, b) => a - b);
  const hash = createHash("sha256").update(input).update("webp-82-v1").digest("hex").slice(0, 16);
  const variants = [];
  for (const width of widths) {
    const url = `/hero-assets/${hash}-${width}.webp`;
    const output = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    await writeFile(path.join(publicDir, url), output);
    variants.push({ width, url, bytes: output.length });
  }
  manifest[src] = variants;
}
await writeFile(path.join(root, "lib/hero-image-assets.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(path.join(root, "lib/hero-image-index.json"), JSON.stringify(Object.fromEntries(Object.entries(manifest).map(([src, variants]) => [src, [variants[0].url.split("/").at(-1).split("-")[0], variants.map(v => v.width)]]))) + "\n");
console.log(`Prepared ${Object.keys(manifest).length} critical image sources as responsive WebP assets.`);
