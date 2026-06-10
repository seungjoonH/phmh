// flow 블록 구조 저장 — 텍스트 값은 별도 draft 커밋 경로에서만 반영
import { patchSectionFlow } from "@/lib/edit/client";
import {
  stripFlowBlockForStorage,
  type FlowBlock,
} from "@/lib/edit/section-flow";

export async function commitSectionFlowDrafts(
  flowDrafts: Record<string, FlowBlock[]>,
): Promise<void> {
  for (const [sectionKey, flow] of Object.entries(flowDrafts)) {
    await patchSectionFlow(
      sectionKey,
      flow.map((block) => stripFlowBlockForStorage(block)),
    );
  }
}
