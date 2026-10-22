export type Risk = "low" | "review" | "high";
export type ScanOrigin = "sample" | "manual-demo" | "manual-model";
export interface ScanRecord {
  id: string;
  risk: Risk;
  createdAt: string;
  origin: ScanOrigin;
  indicatorCount: number;
  characterCount: number;
  mode?: "demo" | "backend_model";
  modelVersion?: string;
}
export interface ScanResult extends ScanRecord {
  text: string;
  indicators: { title: string; description: string }[];
  domains: string[];
  advice: string;
  mode: "demo" | "backend_model";
  policyVersion?: string;
  coverage?: string;
}
export interface Preferences {
  haptics: boolean;
  keepHistory: boolean;
  reduceMotion: boolean;
  notifications: boolean;
  cloudAnalysis: boolean;
}
export interface Lesson {
  id: string;
  title: string;
  category: string;
  duration: number;
  summary: string;
  sections: { heading: string; body: string }[];
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
