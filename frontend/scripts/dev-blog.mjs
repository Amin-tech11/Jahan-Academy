import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const branch = execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8" }).trim();
if (branch !== "blog") {
  console.error(`Blog requires branch blog; current branch is ${branch}.`);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--port", "3900", "--hostname", "127.0.0.1"], { cwd, stdio: "inherit" });
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
