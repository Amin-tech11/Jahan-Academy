import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const mapping = {
  "home-page": 3100,
  destinationS: 3800,
  dashboard: 3101,
  users: 3102,
  orders: 3103,
  develop: 5000,
};

const panel = process.argv[2];
if (!(panel in mapping)) {
  console.error(`Unknown panel: ${panel ?? "(missing)"}`);
  process.exit(1);
}

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: frontendRoot,
  encoding: "utf8",
}).trim();

if (branch !== panel) {
  console.error(`This command requires branch ${panel}; current branch is ${branch || "detached HEAD"}.`);
  process.exit(1);
}

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "--port", String(mapping[panel])], {
  cwd: frontendRoot,
  stdio: "inherit",
  env: { ...process.env, JAHAN_PANEL: panel },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
