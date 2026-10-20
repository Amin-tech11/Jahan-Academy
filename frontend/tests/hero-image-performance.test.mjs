import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const assets = JSON.parse(readFileSync(new URL("../lib/hero-image-assets.json", import.meta.url)));
const news = JSON.parse(readFileSync(new URL("../lib/university-news-data.json", import.meta.url)));
const loaderUrl = new URL("../lib/hero-image-loader.ts", import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(loaderUrl, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, { exports, require: createRequire(loaderUrl) });

test("every university news cover has prepared critical image variants", () => {
  for (const story of news) {
    assert(assets[story.image]?.length > 0, story.image);
    assert.equal(exports.hasPreparedImage(story.image), true, story.image);
  }
});

test("responsive critical images preserve aspect ratio, avoid upscaling and have immutable content identities", async () => {
  for (const [src, variants] of Object.entries(assets)) {
    const input = readFileSync(new URL(`../public${src}`, import.meta.url));
    const original = await sharp(input).metadata();
    const hash = createHash("sha256").update(input).update("webp-82-v1").digest("hex").slice(0, 16);
    let previous = 0;
    for (const variant of variants) {
      assert(variant.width > previous && variant.width <= Math.min(1920, original.width), src);
      assert.equal(variant.url, `/hero-assets/${hash}-${variant.width}.webp`);
      const bytes = readFileSync(new URL(`../public${variant.url}`, import.meta.url));
      const image = await sharp(bytes).metadata();
      assert.equal(image.format, "webp");
      assert.equal(image.width, variant.width);
      assert(Math.abs(image.height - original.height * variant.width / original.width) <= 1);
      assert.equal(bytes.length, variant.bytes);
      previous = variant.width;
    }
  }
});

test("loader chooses adequate mobile/desktop assets, caps large displays, and rejects unprepared inputs", () => {
  const src = "/services-hero-interview.png";
  const variants = assets[src];
  for (const width of [64, 480, 640, 1080, 1920, 3840]) {
    const expected = variants.find(v => v.width >= width) ?? variants.at(-1);
    assert.equal(exports.preparedImageLoader({ src, width }), expected.url);
    assert(existsSync(new URL(`../public${expected.url}`, import.meta.url)));
  }
  assert.equal(exports.hasPreparedImage("/unknown.png"), false);
  assert.throws(() => exports.preparedImageLoader({ src: "/unknown.png", width: 640 }));
});
