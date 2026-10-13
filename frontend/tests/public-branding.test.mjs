import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, extname } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const forbidden = /go2tr|apply\s*board|apply\s*ca|گوتوتی|اپلای[\s‌]*(?:برد|بورد|کا)/iu;
const textFiles = new Set([".ts", ".tsx", ".js", ".json", ".md", ".txt", ".html", ".svg", ".xml", ".csv"]);

function* files(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (textFiles.has(extname(entry.name))) yield path;
  }
}

test("public pages, admin UI and served text assets contain no competitor branding", () => {
  const matches = [];
  for (const directory of ["app", "components", "lib", "public"]) {
    for (const path of files(join(root, directory))) {
      if (forbidden.test(readFileSync(path, "utf8"))) matches.push(relative(root, path));
    }
  }
  assert.deepEqual(matches, [], "Remove competitor names from runtime content; keep private provenance outside public assets.");
});
