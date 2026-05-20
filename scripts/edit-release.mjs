// package.json 패치 버전 증가 및 git release 커밋·push
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

/**
 * @param {string} version
 */
export function bumpPatchVersion(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(version.trim());
  if (!m) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

/**
 * @param {string} root
 */
export function readPackageJson(root) {
  const pkgPath = path.join(root, "package.json");
  const raw = fs.readFileSync(pkgPath, "utf8");
  const match = raw.match(/"version"\s*:\s*"([^"]+)"/);
  if (!match) {
    throw new Error("package.json: version field not found");
  }
  return { pkgPath, raw, version: match[1] };
}

/**
 * @param {string} pkgPath
 * @param {string} raw
 * @param {string} newVersion
 */
export function writePackageVersion(pkgPath, raw, newVersion) {
  const updated = raw.replace(/"version"\s*:\s*"[^"]+"/, `"version": "${newVersion}"`);
  if (updated === raw) {
    throw new Error("package.json: version replace failed");
  }
  fs.writeFileSync(pkgPath, updated, "utf8");
}

/**
 * @param {string} root
 * @param {string} command
 * @param {string[]} args
 */
export function runCommand(root, command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      } else {
        reject(new Error(stderr || stdout || `${command} ${args.join(" ")} exited ${code}`));
      }
    });
  });
}

/**
 * @param {string} root
 * @param {string[]} args
 */
export function runGit(root, args) {
  return runCommand(root, "git", args);
}

/**
 * @param {string} root
 */
export async function runReleaseDeploy(root) {
  await runGit(root, ["switch", "main"]);
  await runGit(root, ["pull", "origin", "main"]);

  const { pkgPath, raw, version: previousVersion } = readPackageJson(root);
  const version = bumpPatchVersion(previousVersion);
  writePackageVersion(pkgPath, raw, version);
  const commitMessage = `release: v${version}`;

  await runCommand(root, "pnpm", ["install"]);

  await runGit(root, ["add", "."]);
  await runGit(root, ["commit", "-m", commitMessage]);
  await runGit(root, ["push", "origin", "main"]);

  return { previousVersion, version, commitMessage };
}
