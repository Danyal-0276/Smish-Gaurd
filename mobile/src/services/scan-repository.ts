import { inspectDemoText } from "../features/scan/demo-engine";
import type { ScanResult } from "../types/domain";

export interface ScanRepository {
  analyze(text: string): Promise<ScanResult>;
}
export const demoScanRepository: ScanRepository = {
  async analyze(text) {
    await new Promise((resolve) => setTimeout(resolve, 1250));
    return inspectDemoText(
      text,
      `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      new Date().toISOString(),
    );
  },
};
// Explicit local demo adapter. Online mode uses online-service.ts after consent;
// a network failure must never silently invoke this simulation.
export const scanRepository = demoScanRepository;
