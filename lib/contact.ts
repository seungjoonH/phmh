// locale별 Contact 경로 (경로 SSOT는 siteConfig)
import { siteConfig, type LocaleId } from "@/lib/config";

export type Locale = LocaleId;

export function getContactPath(locale: Locale): string {
  return locale === "ko"
    ? siteConfig.contact.koreaPath
    : siteConfig.contact.philippinesPath;
}
