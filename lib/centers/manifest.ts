// Center manifest SSOT 읽기 + 편집 미리보기 runtime overlay
import manifestJson from "@/data/centers/manifest.json";
import type { CentersManifest } from "@/lib/centers/types";

export const centersManifest = manifestJson as CentersManifest;

let runtimeOrder: string[] | null = null;

export function setRuntimeCenterOrder(order: string[]): void {
  runtimeOrder = [...order];
}

export function clearRuntimeCenterOrder(): void {
  runtimeOrder = null;
}

export function getCenterSlugsOrdered(): string[] {
  if (runtimeOrder) return [...runtimeOrder];
  return [...centersManifest.order];
}

export function getCenterContentLocaleIds(): readonly string[] {
  return [...centersManifest.contentLocales];
}
