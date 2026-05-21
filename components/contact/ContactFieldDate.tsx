"use client";

// Contact 스키마 date 필드 입력
import { useRef } from "react";
import {
  getContactFormUi,
  type ContactFieldDefinition,
  type ContactFormLocaleKey,
} from "@/lib/contact-form-schema";
import { ContactFieldShell } from "./ContactFieldShell";

type Props = {
  field: ContactFieldDefinition;
  locale: ContactFormLocaleKey;
  label: string;
  placeholder: string;
};

type ParsedDateParts = { y: number; m: number; d: number };

function isValidDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function toIsoDate({ y, m, d }: ParsedDateParts): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIsoDate(iso: string): ParsedDateParts | null {
  const match = iso.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return isValidDate(y, m, d) ? { y, m, d } : null;
}

/** placeholder(Year. Month. Day. / 년. 월. 일.)와 동일한 구두점·순서 */
function formatDottedYmd({ y, m, d }: ParsedDateParts): string {
  return `${y}. ${m}. ${d}.`;
}

function formatDisplayDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  return formatDottedYmd(parsed);
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ContactFieldDate({
  field,
  locale,
  label,
  placeholder,
}: Props) {
  const openCalendarLabel = getContactFormUi(locale, "openCalendar");
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.click();
  };

  const applyFormattedDate = (parsed: ParsedDateParts) => {
    if (!textRef.current) return;
    const iso = toIsoDate(parsed);
    textRef.current.value = formatDisplayDate(iso);
    if (pickerRef.current) pickerRef.current.value = iso;
  };

  const handlePickerChange = (iso: string) => {
    if (!iso) return;
    const parsed = parseIsoDate(iso);
    if (parsed) applyFormattedDate(parsed);
  };

  return (
    <ContactFieldShell label={label} required={field.required}>
      <div className="relative">
        <input
          ref={textRef}
          type="text"
          name={field.id}
          placeholder={placeholder}
          autoComplete={field.autoComplete}
          required={field.required}
          readOnly
          className="input-underline cursor-pointer pr-10 caret-transparent"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Tab" || e.key === "Escape") return;
            e.preventDefault();
          }}
          onPaste={(e) => e.preventDefault()}
        />
        <button
          type="button"
          onClick={openPicker}
          className="absolute bottom-2 right-0 rounded p-1 text-secondary transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          aria-label={openCalendarLabel}
        >
          <CalendarIcon />
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
          onChange={(e) => handlePickerChange(e.target.value)}
        />
      </div>
    </ContactFieldShell>
  );
}
