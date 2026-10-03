import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
if (branch !== "about") {
  console.error(`About preview requires branch about; found ${branch || "detached HEAD"}.`);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--port", "4100", "--hostname", "127.0.0.1"], { cwd: root, stdio: "inherit" });
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
