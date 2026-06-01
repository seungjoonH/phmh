"use client";

// Contact 스키마 필드 → UI (문구 SSOT: lib/contact-form-schema.ts)
// 필드 텍스트/구조 편집은 EditInlineControls 의 「설정」 패널에서 단독 관리한다.
import type { ContactFormLocaleKey } from "@/lib/contact-form-schema";
import type { ContactFieldDefinition } from "@/lib/contact-form-schema";
import {
  useContactFieldBody,
  useContactFieldCheckbox,
  useContactFieldLabel,
  useContactFieldOptions,
  useContactFieldPlaceholder,
} from "@/lib/edit/useContactFieldCopy";
import { ContactFieldDate } from "./ContactFieldDate";
import { ContactFieldShell } from "./ContactFieldShell";

type Props = {
  field: ContactFieldDefinition;
  locale: ContactFormLocaleKey;
};

export function ContactFieldRenderer({ field, locale }: Props) {
  const label = useContactFieldLabel(locale, field.id);
  const placeholder = useContactFieldPlaceholder(locale, field.id);
  const body = useContactFieldBody(locale, field.id);
  const checkbox = useContactFieldCheckbox(locale, field.id);
  const options = useContactFieldOptions(locale, field.id);

  switch (field.type) {
    case "text":
      return (
        <ContactFieldShell label={label} required={field.required}>
          <input
            name={field.id}
            type="text"
            required={field.required}
            autoComplete={field.autoComplete}
            className="input-underline"
            placeholder={placeholder}
          />
        </ContactFieldShell>
      );

    case "email":
      return (
        <ContactFieldShell label={label} required={field.required}>
          <input
            name={field.id}
            type="email"
            required={field.required}
            autoComplete={field.autoComplete}
            className="input-underline"
          />
        </ContactFieldShell>
      );

    case "tel":
      return (
        <ContactFieldShell label={label} required={field.required}>
          <input
            name={field.id}
            type="tel"
            required={field.required}
            autoComplete={field.autoComplete}
            className="input-underline"
          />
        </ContactFieldShell>
      );

    case "date":
      return (
        <ContactFieldDate
          field={field}
          locale={locale}
          label={label}
          placeholder={placeholder ?? ""}
        />
      );

    case "textarea":
      return (
        <ContactFieldShell label={label} required={field.required}>
          <textarea
            name={field.id}
            required={field.required}
            rows={field.rows ?? 3}
            placeholder={placeholder}
            className="input-underline resize-none"
          />
        </ContactFieldShell>
      );

    case "select": {
      return (
        <ContactFieldShell label={label} required={field.required}>
          <select name={field.id} required={field.required} className="input-underline">
            <option value="">—</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </ContactFieldShell>
      );
    }

    case "checkboxGroup": {
      return (
        <fieldset>
          <legend className="mb-3 font-medium">
            {label}
            {field.required ? " *" : ""}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((opt) => (
              <label key={opt} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name={field.id}
                  value={opt}
                  className="input-checkbox"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    case "consent":
      return (
        <fieldset>
          <legend className="mb-2 font-medium">
            {label}
            {field.required ? " *" : ""}
          </legend>
          {body ? (
            <p className="mb-3 whitespace-pre-line text-sm text-page-body/80">
              {body}
            </p>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name={field.id}
              required={field.required}
              className="input-checkbox"
            />
            <span>{checkbox ?? label}</span>
          </label>
        </fieldset>
      );

    default:
      return null;
  }
}
