// Contact 폼 필드·레이아웃 SSOT (JSON + 편집 런타임 오버라이드, Next·webpack)
import staticStructure from "./contact-form-structure.json";
import type { ContactFormStructure } from "./contact-form-types";

export type { ContactFormStructure } from "./contact-form-types";

let runtimeStructure: ContactFormStructure | null = null;

function cloneStructure(source: ContactFormStructure): ContactFormStructure {
  return {
    fields: structuredClone(source.fields),
    layout: structuredClone(source.layout),
  };
}

export function getContactFormStructure(): ContactFormStructure {
  const source = runtimeStructure ?? (staticStructure as ContactFormStructure);
  return cloneStructure(source);
}

export function setRuntimeContactFormStructure(next: ContactFormStructure) {
  runtimeStructure = cloneStructure(next);
}

export function clearRuntimeContactFormStructure() {
  runtimeStructure = null;
}
