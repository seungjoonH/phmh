// data-phmh-edit 속성 헬퍼
export type EditKind = "text" | "image" | "list" | "form-field" | "form-meta";

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

type EditListOptions = {
  /** 빈 목록 자리(+버튼) 등은 click, 기존 목록 본문은 long-press */
  longPress?: boolean;
};

/** 목록(ul/ol) 블록 편집 패널 트리거 */
export function editListAttrs(listKey: string, options?: EditListOptions) {
  const longPress = options?.longPress ?? true;
  return {
    "data-phmh-edit": "list" as const,
    "data-phmh-key": listKey,
    "data-phmh-interaction": (longPress ? "long-press" : "click") as
      | "long-press"
      | "click",
  };
}
