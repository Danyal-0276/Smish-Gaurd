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
// Swap this typed boundary for a separately secured Django adapter later.
// No API request, model prediction, or real SMS access is performed in this build.
export const scanRepository = demoScanRepository;
