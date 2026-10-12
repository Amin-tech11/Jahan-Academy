// Preserve original vector/source credits; serve tiny raster equivalents in 64px controls.
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = `${root}/public/home-country-maps`;
await mkdir(`${root}/public/hero-assets`, { recursive: true });
const assets = {};
let originalBytes = 0, outputBytes = 0;
for (const file of await readdir(directory)) {
  if (!file.endsWith(".svg")) continue;
  const input = await readFile(`${directory}/${file}`);
  const hash = createHash("sha256").update(input).update("map-webp-128-v1").digest("hex").slice(0, 16);
  const output = await sharp(input).resize({ width: 128, height: 128, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 90, effort: 6 }).toBuffer();
  const url = `/hero-assets/${hash}-map-128.webp`;
  await writeFile(`${root}/public${url}`, output);
  assets[file.slice(0, -4)] = url;
  originalBytes += input.length; outputBytes += output.length;
}
await writeFile(`${root}/lib/home-country-map-assets.json`, JSON.stringify(assets, null, 2) + "\n");
console.log(JSON.stringify({ maps: Object.keys(assets).length, originalBytes, outputBytes }));
