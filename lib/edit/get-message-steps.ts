// messages 트리에서 Getting Started steps 배열 읽기
import { coerceStepsArray, type GettingStartedStep } from "@/lib/edit/getting-started-step";
import type { Messages } from "@/lib/i18n/messages";

export function getStepsAtPath(
  messages: Messages,
  keyPath: string,
): GettingStartedStep[] | undefined {
  const parts = keyPath.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  const steps = coerceStepsArray(current);
  return steps.length > 0 || Array.isArray(current) ? steps : undefined;
}
