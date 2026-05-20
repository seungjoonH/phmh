// 상담사 manifest SSOT 읽기
import manifestJson from "@/data/therapists/manifest.json";
import type { TherapistsManifest } from "@/lib/therapists/types";

export const therapistsManifest = manifestJson as TherapistsManifest;

export function getTherapistSlugsOrdered(): string[] {
  return [...therapistsManifest.order];
}

/** 상담사 locale 파일(en.js 등) — data/therapists/manifest.json contentLocales */
export function getTherapistContentLocaleIds(): readonly string[] {
  return [...therapistsManifest.contentLocales];
}
