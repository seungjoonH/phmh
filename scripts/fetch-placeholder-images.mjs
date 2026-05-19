#!/usr/bin/env node
// 플레이스홀더 이미지 다운로드
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "public");

const assets = [
  { dir: "", name: "logo.png", url: "https://picsum.photos/seed/phmh-logo/600/212" },
  { dir: "", name: "logo-light.png", url: "https://picsum.photos/seed/phmh-logo-light/600/212" },
  { dir: "getting-started", name: "01.png", url: "https://picsum.photos/seed/phmh-gs/1600/900" },
  { dir: "fee", name: "01.png", url: "https://picsum.photos/seed/phmh-fee/1600/600" },
  { dir: "services", name: "02.png", url: "https://picsum.photos/seed/phmh-ind/800/500" },
  { dir: "services", name: "03.png", url: "https://picsum.photos/seed/phmh-couples/800/500" },
  { dir: "services", name: "04.png", url: "https://picsum.photos/seed/phmh-family/800/500" },
  { dir: "services", name: "05.png", url: "https://picsum.photos/seed/phmh-play/800/500" },
  { dir: "services", name: "06.png", url: "https://picsum.photos/seed/phmh-group/800/500" },
  { dir: "services", name: "07.png", url: "https://picsum.photos/seed/phmh-christian/800/500" },
  ...Array.from({ length: 14 }, (_, i) => ({
    dir: "service-areas",
    name: `${String(i + 1).padStart(2, "0")}.png`,
    url: `https://picsum.photos/seed/phmh-area-${i + 1}/800/500`,
  })),
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = path.dirname(dest);
  const tmpJpg = path.join(dir, ".__download_tmp.jpg");
  fs.writeFileSync(tmpJpg, buf);
  execSync(`sips -s format png "${tmpJpg}" --out "${dest}"`, { stdio: "ignore" });
  fs.unlinkSync(tmpJpg);
}

const flags = {
  "flags/en.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect fill="#012169" width="60" height="30"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="4"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/></svg>`,
  "flags/jp.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect fill="#fff" width="60" height="40"/><circle cx="30" cy="20" r="8" fill="#C60C30"/></svg>`,
  "flags/ko.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect fill="#fff" width="60" height="40"/><g transform="translate(30,20)"><circle r="8" fill="#CD2E3A"/><path d="M0,-8 A8,8 0 0,1 0,8 A4,4 0 0,0 0,-8Z" fill="#0047A0"/><circle cy="-4" r="2" fill="#0047A0"/><circle cy="4" r="2" fill="#CD2E3A"/></g><g stroke="#000" stroke-width="1.1" stroke-linecap="square"><g transform="translate(8,7)"><line x1="0" y1="0" x2="7" y2="0"/><line x1="0" y1="2.2" x2="7" y2="2.2"/><line x1="0" y1="4.4" x2="7" y2="4.4"/></g><g transform="translate(45,7)"><line x1="0" y1="0" x2="7" y2="0"/><line x1="0" y1="2.2" x2="3" y2="2.2"/><line x1="4" y1="2.2" x2="7" y2="2.2"/><line x1="0" y1="4.4" x2="7" y2="4.4"/></g><g transform="translate(8,28.6)"><line x1="0" y1="0" x2="3" y2="0"/><line x1="4" y1="0" x2="7" y2="0"/><line x1="0" y1="2.2" x2="7" y2="2.2"/><line x1="0" y1="4.4" x2="3" y2="4.4"/><line x1="4" y1="4.4" x2="7" y2="4.4"/></g><g transform="translate(45,28.6)"><line x1="0" y1="0" x2="3" y2="0"/><line x1="4" y1="0" x2="7" y2="0"/><line x1="0" y1="2.2" x2="3" y2="2.2"/><line x1="4" y1="2.2" x2="7" y2="2.2"/><line x1="0" y1="4.4" x2="3" y2="4.4"/><line x1="4" y1="4.4" x2="7" y2="4.4"/></g></g></svg>`,
};

async function main() {
  for (const [rel, svg] of Object.entries(flags)) {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, svg);
  }

  for (const a of assets) {
    const dir = path.join(root, a.dir);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, a.name);
    console.log("Downloading", a.name);
    await download(a.url, dest);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
