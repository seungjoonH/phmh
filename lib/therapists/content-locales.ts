// 상담사 data/{slug}/*.js 에 대응하는 locale id — manifest.json contentLocales SSOT
import { getTherapistContentLocaleIds } from "@/lib/therapists/manifest";

export type TherapistContentLocale = string;

export function getTherapistContentLocales(): readonly string[] {
  return getTherapistContentLocaleIds();
}
