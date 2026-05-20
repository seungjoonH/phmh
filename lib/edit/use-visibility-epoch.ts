// 편집 모드 visibility draft 변경 시 강제 리렌더용 epoch hook
"use client";

import { useEffect, useState } from "react";

export function useVisibilityEpoch(): number {
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const onChange = () => setEpoch((n) => n + 1);
    window.addEventListener("phmh-edit-visibility-changed", onChange);
    return () => window.removeEventListener("phmh-edit-visibility-changed", onChange);
  }, []);
  return epoch;
}
