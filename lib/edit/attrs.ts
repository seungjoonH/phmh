// data-phmh-edit 속성 헬퍼
export type EditKind = "text" | "image" | "form-field" | "form-meta";

type EditTextOptions = {
  longPress?: boolean;
};

export function editTextAttrs(key: string, options?: EditTextOptions) {
  return {
    "data-phmh-edit": "text" as const,
    "data-phmh-key": key,
    "data-phmh-interaction": (options?.longPress ? "long-press" : "click") as
      | "long-press"
      | "click",
  };
}

type EditImageOptions = {
  longPress?: boolean;
};

export function editImageAttrs(key: string, options?: EditImageOptions) {
  const longPress = options?.longPress ?? true;
  return {
    "data-phmh-edit": "image" as const,
    "data-phmh-key": key,
    "data-phmh-interaction": (longPress ? "long-press" : "click") as
      | "long-press"
      | "click",
  };
}
