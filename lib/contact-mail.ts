// Contact 폼 메일 수신·발신·API 키 SSOT — .env (KOREA_*, PHILIPPINES_*) 기반
import type { ContactCenter } from "@/lib/contact-form-values";

function envForCenter(
  center: ContactCenter,
): { emailVar: string; apiKeyVar: string } {
  return center === "korea"
    ? { emailVar: "KOREA_CONTACT_EMAIL", apiKeyVar: "KOREA_RESEND_API_KEY" }
    : {
        emailVar: "PHILIPPINES_CONTACT_EMAIL",
        apiKeyVar: "PHILIPPINES_RESEND_API_KEY",
      };
}

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function getCenterEmail(center: ContactCenter): string {
  const { emailVar } = envForCenter(center);
  const value = readEnv(emailVar);
  if (!value) {
    throw new Error(`Missing env: ${emailVar}`);
  }
  return value;
}

/** Resend API 키 — 센터별 분리 (.env) */
export function getContactResendApiKey(center: ContactCenter): string | null {
  const { apiKeyVar } = envForCenter(center);
  return readEnv(apiKeyVar);
}

/** Resend 수신 — 센터별 `*_CONTACT_EMAIL` */
export function getContactMailTo(center: ContactCenter): string {
  return getCenterEmail(center);
}

/**
 * Resend 발신 (우선순위)
 * 1. `RESEND_FROM` env
 * 2. 센터별 `*_CONTACT_EMAIL`
 */
export function getContactMailFrom(center: ContactCenter): string {
  const override = readEnv("RESEND_FROM");
  if (override) return override;
  const email = getCenterEmail(center);
  return `PHMH Contact <${email}>`;
}
