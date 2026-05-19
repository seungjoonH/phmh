// 로컬 편집 모드 env 판별 (클라이언트·서버)
export function isEditMode(): boolean {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_PHMH_EDIT_MODE === "1";
  }
  return process.env.PHMH_EDIT_MODE === "1" || process.env.NEXT_PUBLIC_PHMH_EDIT_MODE === "1";
}

export const EDIT_SERVER_URL =
  process.env.NEXT_PUBLIC_PHMH_EDIT_SERVER_URL ?? "http://127.0.0.1:4102";

export const EDIT_MODE_HEADER = "x-phmh-edit-mode";
