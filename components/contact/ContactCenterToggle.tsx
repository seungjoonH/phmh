"use client";

// Contact 사이드바 한국·필리핀 센터 전환
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

export type ContactCenter = "korea" | "philippines";

export type ContactCenterToggleHandle = {
  highlight: () => void;
};

type Props = {
  value: ContactCenter;
  onChange: (center: ContactCenter) => void;
};

export const ContactCenterToggle = forwardRef<ContactCenterToggleHandle, Props>(
  function ContactCenterToggle({ value, onChange }, ref) {
    const t = useTranslations();
    const reduce = useReducedMotion();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [flashing, setFlashing] = useState(false);

    useImperativeHandle(ref, () => ({
      highlight: () => {
        wrapperRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setFlashing(false);
        requestAnimationFrame(() => setFlashing(true));
      },
    }));

    const options: { id: ContactCenter; label: string }[] = [
      { id: "korea", label: t("contact.centerKorea") },
      { id: "philippines", label: t("contact.centerPhilippines") },
    ];

    return (
      <motion.div
        ref={wrapperRef}
        className="mb-6 flex w-full gap-1.5 rounded-md border border-page-body/20 p-1"
        role="group"
        aria-label={t("contact.centerToggleLabel")}
        animate={
          flashing && !reduce
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(0,0,0,0)",
                  "0 0 0 4px var(--color-secondary)",
                  "0 0 0 0 rgba(0,0,0,0)",
                  "0 0 0 4px var(--color-secondary)",
                  "0 0 0 0 rgba(0,0,0,0)",
                ],
              }
            : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
        }
        transition={{ duration: 1.2, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (flashing) setFlashing(false);
        }}
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
  },
);
