// edit 모드 미리보기용 Center 런타임 오버레이
import { centerRecordsBySlug } from "@/lib/centers/registry";
import type { CenterRecord } from "@/lib/centers/types";

const runtimeBySlug: Record<string, CenterRecord> = {};

export function getCenterRecord(slug: string): CenterRecord | undefined {
  return runtimeBySlug[slug] ?? centerRecordsBySlug[slug];
}

export function setCenterRuntime(slug: string, record: CenterRecord): void {
  runtimeBySlug[slug] = record;
}

export function clearCenterRuntime(slug?: string): void {
  if (slug) {
    delete runtimeBySlug[slug];
    return;
  }
  for (const key of Object.keys(runtimeBySlug)) {
    delete runtimeBySlug[key];
  }
}
