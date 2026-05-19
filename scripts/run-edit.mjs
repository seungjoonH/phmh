#!/usr/bin/env node
// edit-server + next dev (PHMH_EDIT_MODE) 동시 실행
import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { EDIT_APP_PORT, EDIT_SERVER_PORT } from "../lib/edit/ports.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const env = {
  ...process.env,
  PHMH_EDIT_MODE: "1",
  NEXT_PUBLIC_PHMH_EDIT_MODE: "1",
  NEXT_PUBLIC_PHMH_EDIT_SERVER_URL: `http://127.0.0.1:${EDIT_SERVER_PORT}`,
};

const children = [];

function spawnProc(command, args, label) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[run-edit] ${label} exited with ${code}`);
    }
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

spawnProc("node", ["--experimental-strip-types", "scripts/edit-server.mjs"], "edit-server");
spawnProc("pnpm", ["exec", "next", "dev", "-p", String(EDIT_APP_PORT)], "next-dev");
