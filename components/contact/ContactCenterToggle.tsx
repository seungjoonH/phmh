"use client";

// Contact 사이드바 한국·필리핀 센터 전환
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export type ContactCenter = "korea" | "philippines";

type Props = {
  value: ContactCenter;
  onChange: (center: ContactCenter) => void;
};

export function ContactCenterToggle({ value, onChange }: Props) {
  const t = useTranslations();
  const reduce = useReducedMotion();

  const options: { id: ContactCenter; label: string }[] = [
    { id: "korea", label: t("contact.centerKorea") },
    { id: "philippines", label: t("contact.centerPhilippines") },
  ];

  return (
    <motion.div
      className="mb-6 flex gap-1.5 rounded-md border border-page-body/20 p-1"
      role="group"
      aria-label={t("contact.centerToggleLabel")}
    >
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          aria-pressed={value === opt.id}
          className={`interactive-button flex-1 rounded px-2 py-2 text-sm font-medium ${
            value === opt.id
              ? "bg-secondary text-secondary-foreground"
              : "text-page-body hover:bg-page-body/5"
          }`}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          {opt.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
