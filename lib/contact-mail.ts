// Contact 폼 메일 수신·발신 SSOT (개발·배포 동일)
import { siteConfig } from "@/lib/config";

function isResendSandbox(): boolean {
  const forceProdFrom = process.env.RESEND_SANDBOX === "false";
  return (
    process.env.RESEND_SANDBOX === "true" ||
    (process.env.NODE_ENV === "development" && !forceProdFrom)
  );
}

/** Resend 수신 — `mail.to` (샌드박스 시 `RESEND_SANDBOX_TO` 선택) */
export function getContactMailTo(): string {
  const sandboxTo = process.env.RESEND_SANDBOX_TO?.trim();
  if (isResendSandbox() && sandboxTo) {
    return sandboxTo;
  }
  return siteConfig.mail.to;
}

/**
 * Resend 발신 (우선순위)
 * 1. `RESEND_FROM` env
 * 2. 로컬 개발 → `mail.fromSandbox` (도메인 미인증)
 * 3. `mail.from` (도메인 인증 후)
 */
export function getContactMailFrom(): string {
  const override = process.env.RESEND_FROM?.trim();
  if (override) return override;
  if (isResendSandbox()) return siteConfig.mail.fromSandbox;
  return siteConfig.mail.from;
}
