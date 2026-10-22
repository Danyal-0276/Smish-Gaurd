import type { ScanRecord, ScanResult } from "../types/domain";
export const HISTORY_DAYS = 30;
export const MAX_HISTORY = 200;

/** Explicit allowlist: raw text, domains, explanations and credentials stay out. */
export function toMetadata(result: ScanResult): ScanRecord {
  const {
    id,
    risk,
    createdAt,
    origin,
    indicatorCount,
    characterCount,
    mode,
    modelVersion,
  } = result;
  return {
    id,
    risk,
    createdAt,
    origin,
    indicatorCount,
    characterCount,
    mode,
    modelVersion,
  };
}
export function retainHistory(
  records: ScanRecord[],
  now = Date.now(),
): ScanRecord[] {
  const cutoff = now - HISTORY_DAYS * 86400000;
  return records
    .filter((record) => {
      const date = Date.parse(record.createdAt);
      return Number.isFinite(date) && date >= cutoff && date <= now + 86400000;
    })
    .slice(0, MAX_HISTORY);
}
