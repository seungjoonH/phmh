// edit 모드 미리보기용 상담사 런타임 오버레이
import { therapistRecordsBySlug } from "@/lib/therapists/registry";
import type { TherapistRecord } from "@/lib/therapists/types";

const runtimeBySlug: Record<string, TherapistRecord> = {};

export function getTherapistRecord(slug: string): TherapistRecord | undefined {
  return runtimeBySlug[slug] ?? therapistRecordsBySlug[slug];
}

export function setTherapistRuntime(slug: string, record: TherapistRecord): void {
  runtimeBySlug[slug] = record;
}

export function clearTherapistRuntime(slug?: string): void {
  if (slug) {
    delete runtimeBySlug[slug];
    return;
  }
  for (const key of Object.keys(runtimeBySlug)) {
    delete runtimeBySlug[key];
  }
}

export function renameTherapistRuntime(oldSlug: string, newSlug: string): void {
  if (oldSlug === newSlug) return;
  const record = runtimeBySlug[oldSlug];
  if (record) {
    runtimeBySlug[newSlug] = { ...record, slug: newSlug };
  }
  delete runtimeBySlug[oldSlug];
}
