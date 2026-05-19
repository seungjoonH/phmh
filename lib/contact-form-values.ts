// Contact 폼 값 수집·검증 (스키마 SSOT 기반)
import {
  CONTACT_FORM_META,
  getContactFormFields,
  getContactField,
  type ContactFieldDefinition,
} from "@/lib/contact-form-schema";

export type ContactCenter = "korea" | "philippines";

export type ContactFieldValue = string | string[] | boolean;

export type ContactFormValues = {
  center: ContactCenter;
  fields: Record<string, ContactFieldValue>;
};

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function maxLengthForType(type: ContactFieldDefinition["type"]): number {
  switch (type) {
    case "email":
      return 254;
    case "tel":
      return 64;
    case "textarea":
      return 8000;
    case "select":
      return 256;
    case "date":
      return 64;
    case "text":
    default:
      return 4000;
  }
}

function validateField(
  field: ContactFieldDefinition,
  raw: unknown,
): { ok: true; value: ContactFieldValue } | { ok: false; error: string } {
  switch (field.type) {
    case "consent": {
      const agreed = raw === true || raw === "true";
      if (field.required && !agreed) {
        return { ok: false, error: "Consent required" };
      }
      return { ok: true, value: agreed };
    }
    case "checkboxGroup": {
      const list = Array.isArray(raw)
        ? raw
            .filter((v): v is string => typeof v === "string")
            .map((v) => v.trim())
            .filter(Boolean)
        : typeof raw === "string" && raw.trim()
          ? [raw.trim()]
          : [];
      if (field.required && list.length === 0) {
        return { ok: false, error: `Field required: ${field.id}` };
      }
      return { ok: true, value: list };
    }
    case "email": {
      const value = asTrimmedString(raw, maxLengthForType("email"));
      if (!value) {
        return { ok: false, error: field.required ? "Invalid email" : "Invalid email" };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { ok: false, error: "Invalid email" };
      }
      return { ok: true, value };
    }
    default: {
      const max = maxLengthForType(field.type);
      const value = asTrimmedString(raw, max);
      if (!value) {
        if (field.required) {
          return { ok: false, error: `Missing required field: ${field.id}` };
        }
        return { ok: true, value: "" };
      }
      return { ok: true, value };
    }
  }
}

export function parseContactPayload(body: unknown):
  | { ok: true; data: ContactFormValues }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const raw = body as Record<string, unknown>;

  if (raw[CONTACT_FORM_META.honeypot] && String(raw[CONTACT_FORM_META.honeypot]).trim()) {
    return { ok: false, error: "Spam detected" };
  }

  const center = raw.center;
  if (center !== "korea" && center !== "philippines") {
    return { ok: false, error: "Invalid center" };
  }

  const fields: Record<string, ContactFieldValue> = {};

  for (const field of getContactFormFields()) {
    const result = validateField(field, raw[field.id]);
    if (!result.ok) return { ok: false, error: result.error };
    if (field.type === "consent") {
      if (result.value === true) fields[field.id] = true;
    } else if (typeof result.value === "string" && result.value) {
      fields[field.id] = result.value;
    } else if (Array.isArray(result.value) && result.value.length > 0) {
      fields[field.id] = result.value;
    } else if (Array.isArray(result.value)) {
      fields[field.id] = result.value;
    }
  }

  return { ok: true, data: { center, fields } };
}

export function collectFormData(form: HTMLFormElement): Record<string, unknown> {
  const fd = new FormData(form);
  const payload: Record<string, unknown> = {};

  for (const field of getContactFormFields()) {
    if (field.type === "checkboxGroup") {
      payload[field.id] = fd.getAll(field.id).map(String);
    } else if (field.type === "consent") {
      payload[field.id] = fd.get(field.id) === "on";
    } else {
      payload[field.id] = String(fd.get(field.id) ?? "");
    }
  }

  payload[CONTACT_FORM_META.honeypot] = String(fd.get(CONTACT_FORM_META.honeypot) ?? "");
  return payload;
}

export function isFormComplete(form: HTMLFormElement): boolean {
  const payload = collectFormData(form);
  const parsed = parseContactPayload({ center: "korea", ...payload });
  if (!parsed.ok) return false;

  for (const field of getContactFormFields()) {
    if (!field.required) continue;
    const value = parsed.data.fields[field.id];
    if (field.type === "consent") {
      if (value !== true) return false;
    } else if (field.type === "checkboxGroup") {
      if (!Array.isArray(value) || value.length === 0) return false;
    } else if (typeof value !== "string" || !value.trim()) {
      return false;
    }
  }

  const emailField = getContactField(CONTACT_FORM_META.replyToFieldId);
  if (emailField?.type === "email") {
    const emailEl = form.elements.namedItem(CONTACT_FORM_META.replyToFieldId) as
      | HTMLInputElement
      | null;
    if (!emailEl?.validity.valid || !emailEl.value.trim()) return false;
  }

  return true;
}

export function buildSubmitPayload(
  center: ContactCenter,
  form: HTMLFormElement,
): Record<string, unknown> {
  return { center, ...collectFormData(form) };
}

export function getFieldString(values: ContactFormValues, id: string): string {
  const v = values.fields[id];
  return typeof v === "string" ? v : "";
}

export function getFieldStringList(values: ContactFormValues, id: string): string[] {
  const v = values.fields[id];
  return Array.isArray(v) ? v : [];
}
