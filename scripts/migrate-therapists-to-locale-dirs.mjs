#!/usr/bin/env node
// 기존 data/therapists/{slug}.js → {slug}/meta.js + en|ko|jp.js 마이그레이션
import * as path from "path";
import { fileURLToPath } from "url";
import {
  isSplitTherapistLayout,
  readManifest,
  readTherapist,
  writeTherapist,
} from "./therapist-io.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const manifest = readManifest(ROOT);

for (const slug of manifest.order) {
  if (isSplitTherapistLayout(ROOT, slug)) {
    console.log(`skip (already split): ${slug}`);
    continue;
  }
  const record = await readTherapist(ROOT, slug);
  writeTherapist(ROOT, slug, record);
  console.log(`migrated: ${slug}`);
}

console.log("done");
