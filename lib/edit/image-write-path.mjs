// 이미지 덮어쓰기 시 슬롯 폴더로 이전본 아카이브 경로 생성
import path from "path";

/**
 * @param {Date} [date]
 * @returns {string} 예: 2026-05-19T15-30-45-123 (로컬 시각, ms 포함)
 */
export function formatImageBackupTimestamp(date = new Date()) {
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${y}-${mo}-${d}T${h}-${mi}-${s}-${ms}`;
}

/**
 * 기존 슬롯 파일을 아카이브할 경로 (이동 대상).
 * @param {string} targetRelPath repo 루트 기준 (예: public/service-areas/01.png)
 * @param {Date} [date]
 * @returns {string} 예: public/service-areas/01/01-2026-05-19T15-30-45-123.png
 */
export function buildImageHistoryBackupPath(targetRelPath, date = new Date()) {
  const normalized = targetRelPath.split("\\").join("/");
  const parentDir = path.posix.dirname(normalized);
  const ext = path.posix.extname(normalized);
  const stem = path.posix.basename(normalized, ext);
  const stamp = formatImageBackupTimestamp(date);
  const archiveName = `${stem}-${stamp}${ext}`;
  return parentDir === "." ? `${stem}/${archiveName}` : `${parentDir}/${stem}/${archiveName}`;
}
