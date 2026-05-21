"use client";

// Contact 인테이크 폼 (필드·문구 SSOT → UI·API·메일)
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { isLocaleId } from "@/lib/config";
import {
  CONTACT_FORM_META,
  getContactFormLayout,
  getContactField,
  getContactFormUi,
  type ContactFormLocaleKey,
} from "@/lib/contact-form-schema";
import { editTextAttrs } from "@/lib/edit/attrs";
import { useContactFormUi } from "@/lib/edit/useContactFieldCopy";
import { buildSubmitPayload, isFormComplete } from "@/lib/contact-form-values";
import { EditableContactForm } from "@/components/contact/EditableContactForm";
import { ContactFieldRenderer } from "./ContactFieldRenderer";
import { ResidencyConfirmDialog } from "./ResidencyConfirmDialog";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  center: "korea" | "philippines";
  onResidencyDecline?: () => void;
};

export function ContactForm({ center, onResidencyDecline }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const formLocale: ContactFormLocaleKey = isLocaleId(locale) ? locale : "en";
  const submitLabel = useContactFormUi(formLocale, "submit");
  const sendingLabel = useContactFormUi(formLocale, "sending");
  const reduce = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [residencyOpen, setResidencyOpen] = useState(false);

  const countryLabel = useContactFormUi(
    formLocale,
    center === "korea" ? "residencyKorea" : "residencyPhilippines",
  );
  const residencyTitle = useContactFormUi(formLocale, "residencyConfirmTitle");
  const residencyMessage = useContactFormUi(
    formLocale,
    "residencyConfirmMessage",
  );
  const residencyConfirm = useContactFormUi(
    formLocale,
    "residencyConfirmConfirm",
  );
  const residencyCancel = useContactFormUi(
    formLocale,
    "residencyConfirmCancel",
  );

  const syncCanSubmit = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    setCanSubmit(isFormComplete(form));
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || !canSubmit || submitting) return;
    setResidencyOpen(true);
  };

  const submitToServer = async () => {
    const form = formRef.current;
    if (!form) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSubmitPayload(center, form)),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? getContactFormUi(formLocale, "error"));
        return;
      }

      router.push("/thank-you");
    } catch {
      setError(getContactFormUi(formLocale, "error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResidencyConfirm = () => {
    setResidencyOpen(false);
    void submitToServer();
  };

  const handleResidencyCancel = () => {
    setResidencyOpen(false);
    onResidencyDecline?.();
  };

  return (
    <form
      ref={formRef}
      className="space-y-6"
      onInput={syncCanSubmit}
      onChange={syncCanSubmit}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        name={CONTACT_FORM_META.honeypot}
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
        aria-hidden
      />

      {isEditMode() ? (
        <EditableContactForm locale={formLocale} onStructureChange={syncCanSubmit} />
      ) : (
        getContactFormLayout().map((item) => {
        if (item.type === "row") {
          return (
            <div key={item.fields.join("-")} className="grid gap-6 md:grid-cols-2">
              {item.fields.map((fieldId) => {
                const field = getContactField(fieldId);
                if (!field) return null;
                return (
                  <ContactFieldRenderer
                    key={field.id}
                    field={field}
                    locale={formLocale}
                  />
                );
              })}
            </div>
          );
        }

        const field = getContactField(item.fieldId);
        if (!field) return null;
        return (
          <ContactFieldRenderer key={field.id} field={field} locale={formLocale} />
        );
        })
      )}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <motion.button
        type="submit"
        className="cta-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSubmit || submitting}
        whileTap={reduce || !canSubmit || submitting ? undefined : { scale: 0.98 }}
        {...editTextAttrs("contactForm.form.submit", { longPress: true })}
      >
        {submitting ? sendingLabel : submitLabel}
      </motion.button>

      <ResidencyConfirmDialog
        open={residencyOpen}
        country={countryLabel}
        title={residencyTitle}
        message={residencyMessage}
        confirmLabel={residencyConfirm}
        cancelLabel={residencyCancel}
        onConfirm={handleResidencyConfirm}
        onCancel={handleResidencyCancel}
      />
    </form>
  );
}
