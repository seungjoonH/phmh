// 상담사 manifest SSOT 읽기 + 편집 미리보기 runtime overlay
import manifestJson from "@/data/therapists/manifest.json";
import type { TherapistsManifest } from "@/lib/therapists/types";

export const therapistsManifest = manifestJson as TherapistsManifest;

let runtimeOrder: string[] | null = null;

export function setRuntimeTherapistOrder(order: string[]): void {
  runtimeOrder = [...order];
}

export function clearRuntimeTherapistOrder(): void {
  runtimeOrder = null;
}

export function getTherapistSlugsOrdered(): string[] {
  if (runtimeOrder) return [...runtimeOrder];
  return [...therapistsManifest.order];
}

/** 상담사 locale 파일(en.js 등) — data/therapists/manifest.json contentLocales */
export function getTherapistContentLocaleIds(): readonly string[] {
  return [...therapistsManifest.contentLocales];
}
