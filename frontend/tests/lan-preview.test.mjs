import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const ts = createRequire(import.meta.url)("typescript");
const source = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
function config(env) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    module, exports: module.exports, process: { env },
  });
  return module.exports.default;
}

test("LAN development access is limited to explicitly configured hosts", () => {
  assert.equal(config({}).allowedDevOrigins.length, 0);
  assert.deepEqual(Array.from(config({ JAHAN_DEV_ORIGINS: "192.168.8.61, preview.local, " }).allowedDevOrigins), ["192.168.8.61", "preview.local"]);
});
