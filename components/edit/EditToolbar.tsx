"use client";

// 편집 모드 플로팅 컨트롤러 — 미리보기 후 일괄 저장·취소
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { SitePagesPanel } from "@/components/edit/SitePagesPanel";
import { deployRelease } from "@/lib/edit/client";
import { duration, motionTransition } from "@/lib/motion";
import { confirm as showConfirm } from "@/components/ui/AppDialog";

function ChevronIcon({ up }: { up?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {up ? (
        <path d="M6 15l6-6 6 6" />
      ) : (
        <path d="M6 9l6 6 6-6" />
      )}
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function EditToolbar() {
  const { pendingCount, committing, revertAll, commitAll } = useEditDraft();
  const [expanded, setExpanded] = useState(false);
  const [deployMsg, setDeployMsg] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [sitePagesOpen, setSitePagesOpen] = useState(false);
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const handleSave = async () => {
    if (pendingCount === 0 || committing) return;
    try {
      await commitAll();
    } catch {
      /* commitAll shows alert */
    }
  };

  const handleCancel = async () => {
    if (committing) return;
    if (
      pendingCount > 0 &&
      !(await showConfirm({
        message: "저장하지 않은 변경을 모두 취소할까요?",
        danger: true,
      }))
    )
      return;
    revertAll();
    setExpanded(false);
  };

  const handleDeploy = async () => {
    if (committing || deploying) return;
    if (
      !(await showConfirm({
        title: "배포",
        message:
          "package.json 버전을 올리고 release 커밋 후 origin/main에 push합니다. 계속할까요?",
      }))
    ) {
      return;
    }

    setDeployMsg(null);
    setDeploying(true);
    try {
      if (pendingCount > 0) {
        await commitAll();
      }
      const result = await deployRelease();
      setDeployMsg(
        `배포 완료\n` +
          `버전: v${result.previousVersion} → v${result.version}\n` +
          `커밋: ${result.commitMessage}\n` +
          `push: origin/main\n\n` +
          `Cloudflare Pages가 main push를 감지해 빌드합니다.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "배포에 실패했습니다.";
      setDeployMsg(message);
    } finally {
      setDeploying(false);
    }
  };

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(e.target as Node)) return;
      setExpanded(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const panelTransition = motionTransition(reduce, { duration: duration.fast });

  return (
    <motion.div
      ref={rootRef}
      data-phmh-edit-controller
      className="fixed z-[70] flex flex-col items-end gap-2"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <AnimatePresence>
        {expanded ? (
          <motion.div
            key="panel"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
            transition={panelTransition}
            className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-primary/25 bg-primary text-primary-foreground shadow-lg"
          >
            <div className="border-b border-primary-foreground/15 px-4 py-3">
              <p className="font-semibold tracking-wide">PHMH 편집 모드</p>
              {pendingCount > 0 ? (
                <p className="mt-1 text-xs text-primary-foreground/90">
                  미저장 {pendingCount}건 · 화면은 미리보기입니다
                </p>
              ) : (
                <p className="mt-1 text-xs text-primary-foreground/75">변경 없음</p>
              )}
            </div>
            <div className="flex flex-col gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setSitePagesOpen(true)}
                className="interactive-button w-full rounded px-3 py-2 text-left text-sm hover:bg-primary-foreground/15"
              >
                페이지 노출
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  className="interactive-button flex-1 rounded px-3 py-2 text-sm hover:bg-primary-foreground/15 disabled:opacity-50"
                  disabled={committing || pendingCount === 0}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className={
                    pendingCount > 0
                      ? "interactive-button flex-1 rounded bg-primary-foreground px-3 py-2 text-sm font-medium text-primary disabled:opacity-50"
                      : "interactive-button flex-1 rounded px-3 py-2 text-sm hover:bg-primary-foreground/15 disabled:opacity-50"
                  }
                  disabled={pendingCount === 0 || committing}
                >
                  {committing ? "저장 중…" : "저장"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void handleDeploy()}
                className={
                  pendingCount === 0
                    ? "interactive-button w-full rounded bg-primary-foreground px-3 py-2 text-sm font-medium text-primary disabled:opacity-50"
                    : "interactive-button w-full rounded px-3 py-2 text-left text-sm hover:bg-primary-foreground/15 disabled:opacity-50"
                }
                disabled={committing || deploying}
              >
                {deploying ? "배포 중…" : "배포"}
              </button>
            </div>
            {deployMsg ? (
              <div className="border-t border-primary-foreground/15 bg-primary-foreground/10 px-4 py-2 text-xs whitespace-pre-wrap">
                {deployMsg}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="interactive-button relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary-foreground/20 hover:shadow-xl"
        aria-expanded={expanded}
        aria-label={expanded ? "편집 컨트롤 닫기" : "편집 컨트롤 열기"}
      >
        {expanded ? <ChevronIcon up /> : <PencilIcon />}
        {!expanded && pendingCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground ring-2 ring-primary">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        ) : null}
      </button>
      {sitePagesOpen ? <SitePagesPanel onClose={() => setSitePagesOpen(false)} /> : null}
    </motion.div>
  );
}
