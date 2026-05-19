"use client";

// Contact 스키마 필드 → UI (문구 SSOT: lib/contact-form-schema.ts)
import type { ContactFormLocaleKey } from "@/lib/contact-form-schema";
import {
  getContactFieldCopy,
  getFieldOptions,
  type ContactFieldDefinition,
} from "@/lib/contact-form-schema";
import { editTextAttrs } from "@/lib/edit/attrs";
import {
  useContactFieldLabel,
  useContactFieldPlaceholder,
} from "@/lib/edit/useContactFieldCopy";
import { ContactFieldDate } from "./ContactFieldDate";
import { ContactFieldShell } from "./ContactFieldShell";

type Props = {
  field: ContactFieldDefinition;
  locale: ContactFormLocaleKey;
};

function fieldLabelKey(fieldId: string) {
  return `contactForm.fields.${fieldId}.label`;
}

function fieldPlaceholderKey(fieldId: string) {
  return `contactForm.fields.${fieldId}.placeholder`;
}

export function ContactFieldRenderer({ field, locale }: Props) {
  const copy = getContactFieldCopy(locale, field.id);
  const label = useContactFieldLabel(locale, field.id);
  const placeholder = useContactFieldPlaceholder(locale, field.id);
  const labelKey = fieldLabelKey(field.id);
  const placeholderKey = fieldPlaceholderKey(field.id);

  switch (field.type) {
    case "text":
      return (
        <ContactFieldShell label={label} required={field.required} labelEditKey={labelKey}>
          <input
            name={field.id}
            type="text"
            required={field.required}
            autoComplete={field.autoComplete}
            className="input-underline"
            placeholder={placeholder}
            {...(placeholder ? editTextAttrs(placeholderKey, { longPress: true }) : {})}
          />
        </ContactFieldShell>
      );

    case "email":
      return (
        <ContactFieldShell label={label} required={field.required} labelEditKey={labelKey}>
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
        <ContactFieldShell label={label} required={field.required} labelEditKey={labelKey}>
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
          labelEditKey={labelKey}
          placeholderEditKey={placeholderKey}
        />
      );

    case "textarea":
      return (
        <ContactFieldShell label={label} required={field.required} labelEditKey={labelKey}>
          <textarea
            name={field.id}
            required={field.required}
            rows={field.rows ?? 3}
            placeholder={placeholder}
            className="input-underline resize-none"
            {...(placeholder ? editTextAttrs(placeholderKey, { longPress: true }) : {})}
          />
        </ContactFieldShell>
      );

    case "select": {
      const options = getFieldOptions(locale, field.id);
      return (
        <ContactFieldShell label={label} required={field.required} labelEditKey={labelKey}>
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
      const options = getFieldOptions(locale, field.id);
      return (
        <fieldset>
          <legend
            className="mb-3 font-medium"
            {...editTextAttrs(labelKey)}
          >
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
          <legend
            className="mb-2 font-medium"
            {...editTextAttrs(labelKey)}
          >
            {label}
            {field.required ? " *" : ""}
          </legend>
          {copy?.body ? (
            <p
              className="mb-3 whitespace-pre-line text-sm text-page-body/80"
              {...editTextAttrs(`contactForm.fields.${field.id}.body`)}
            >
              {copy.body}
            </p>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name={field.id}
              required={field.required}
              className="input-checkbox"
            />
            <span {...editTextAttrs(`contactForm.fields.${field.id}.checkbox`)}>
              {copy?.checkbox ?? label}
            </span>
          </label>
        </fieldset>
      );

    default:
      return null;
  }
}
