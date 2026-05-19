// Contact 폼 공유 타입 (Node·Next 공통 — path alias 없음)

export type ContactFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "select"
  | "checkboxGroup"
  | "consent";

export type ContactMailRender =
  | { kind: "inline" }
  | { kind: "block" }
  | { kind: "list" }
  | { kind: "skip" };

export type ContactFieldDefinition = {
  id: string;
  type: ContactFieldType;
  required?: boolean;
  rows?: number;
  mailLabel: string;
  mail: ContactMailRender;
  autoComplete?: string;
};

export type ContactLayoutItem =
  | { type: "row"; fields: readonly string[] }
  | { type: "field"; fieldId: string };

export type ContactFormFieldCopy = {
  label: string;
  placeholder?: string;
  body?: string;
  checkbox?: string;
  options?: readonly string[];
};

export type ContactFormLocaleBlock = {
  form: {
    submit: string;
    sending: string;
    error: string;
    openCalendar: string;
  };
  fields: Record<string, ContactFormFieldCopy>;
};

export type ContactFormStructure = {
  fields: ContactFieldDefinition[];
  layout: ContactLayoutItem[];
};
