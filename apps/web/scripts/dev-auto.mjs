#!/usr/bin/env node
/**
 * Start next dev on 3000 if free, else 3001.
 * Default: --turbo (Turbopack) to avoid Watchpack EMFILE; set CDP_WEBPACK_DEV=1 for webpack dev.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const useWebpack = process.env.CDP_WEBPACK_DEV === "1";

function portFree(port) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.listen(port, () => {
      s.close(() => resolve(true));
    });
  });
}

const use3000 = await portFree(3000);
const port = use3000 ? 3000 : 3001;
if (!use3000) {
  console.log("\n  Port 3000 is in use — starting on http://localhost:3001\n");
}

const args = ["next", "dev", "-p", String(port)];
if (!useWebpack) {
  args.push("--turbo");
  console.log("\n  Using Turbopack (--turbo). For webpack dev: CDP_WEBPACK_DEV=1 pnpm dev:auto\n");
}

const child = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
  cwd: appRoot,
  env: {
    ...process.env,
    // Webpack dev only; Turbopack ignores these but harmless
    WATCHPACK_POLLING: "true",
    WATCHPACK_WATCHER_LIMIT: "20",
    ...(useWebpack && { CDP_DEV_POLL: "1" }),
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
