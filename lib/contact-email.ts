// Contact 폼 메일 본문 생성 (스키마 SSOT 기반)
import {
  CONTACT_FORM_META,
  getContactFieldsForMail,
  type ContactFieldDefinition,
} from "@/lib/contact-form-schema";
import { getContactMailFrom, getContactMailTo } from "@/lib/contact-mail";
import {
  getFieldString,
  getFieldStringList,
  type ContactFormValues,
} from "@/lib/contact-form-values";

const CENTER_LABEL = {
  korea: "Korea Center",
  philippines: "Philippines Center",
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFieldValue(field: ContactFieldDefinition, values: ContactFormValues): string {
  if (field.type === "checkboxGroup") {
    return getFieldStringList(values, field.id).join(", ");
  }
  return getFieldString(values, field.id);
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `<tr><th align="left" style="padding:8px 12px 8px 0;vertical-align:top;color:#1f4d3a;font-weight:600;white-space:nowrap">${escapeHtml(label)}</th><td style="padding:8px 0;vertical-align:top;color:#333">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
}

export function buildContactEmail(values: ContactFormValues) {
  const centerLabel = CENTER_LABEL[values.center];
  const nameParts = CONTACT_FORM_META.subjectNameFieldIds.map((id) =>
    getFieldString(values, id),
  );
  const fullName = nameParts.filter(Boolean).join(" ").trim() || "Contact";
  const replyTo = getFieldString(values, CONTACT_FORM_META.replyToFieldId);
  const subject = `[PHMH · ${centerLabel}] ${fullName}`;

  const textLines: string[] = [`New contact form submission — ${centerLabel}`, ""];
  const htmlInlineRows: string[] = [];
  const htmlBlocks: string[] = [];
  const htmlLists: string[] = [];

  for (const field of getContactFieldsForMail()) {
    const label = field.mailLabel;
    const value = formatFieldValue(field, values);

    if (field.mail.kind === "inline") {
      if (!value) continue;
      textLines.push(`${label}: ${value}`);
      htmlInlineRows.push(row(label, value));
      continue;
    }

    if (field.mail.kind === "list") {
      const items = getFieldStringList(values, field.id);
      if (items.length === 0) continue;
      textLines.push("", `${label}:`, ...items.map((item) => `• ${item}`));
      htmlLists.push(
        `<p style="margin:0 0 8px;font-weight:600;color:#1f4d3a">${escapeHtml(label)}</p>`,
        `<ul style="margin:0 0 20px;padding-left:20px">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
      );
      continue;
    }

    if (field.mail.kind === "block") {
      if (!value) continue;
      textLines.push("", label, value);
      htmlBlocks.push(
        `<p style="margin:0 0 8px;font-weight:600;color:#1f4d3a">${escapeHtml(label)}</p>`,
        `<p style="margin:0 0 20px;white-space:pre-wrap">${escapeHtml(value)}</p>`,
      );
    }
  }

  textLines.push("", "—", "Reply to this email to reach the client directly.");

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.5;color:#333;max-width:640px">
  <p style="margin:0 0 16px"><strong>New contact — ${escapeHtml(centerLabel)}</strong></p>
  ${
    htmlInlineRows.length
      ? `<table style="border-collapse:collapse;width:100%;margin-bottom:24px">${htmlInlineRows.join("")}</table>`
      : ""
  }
  ${htmlBlocks.join("")}
  ${htmlLists.join("")}
  <p style="margin:24px 0 0;font-size:13px;color:#666">Reply to this email to reach ${escapeHtml(fullName)}${replyTo ? ` at ${escapeHtml(replyTo)}` : ""}.</p>
</body>
</html>`;

  return {
    from: getContactMailFrom(values.center),
    to: [getContactMailTo(values.center)],
    replyTo,
    subject,
    text: textLines.join("\n"),
    html,
  };
}

// API route 호환
export { parseContactPayload } from "@/lib/contact-form-values";
export type { ContactFormValues } from "@/lib/contact-form-values";
