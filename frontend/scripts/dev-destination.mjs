import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const branch = execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8" }).trim();
if (branch !== "destination") {
  console.error(`Destination panel requires branch destination; current branch: ${branch}.`);
  process.exit(1);
}
const require = createRequire(import.meta.url);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3700"], {
  cwd, stdio: "inherit", env: { ...process.env, JAHAN_DESTINATION_PANEL: "1" },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
