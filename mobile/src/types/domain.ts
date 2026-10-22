export type Risk = "low" | "review" | "high";
export type ScanOrigin = "sample" | "manual-demo";
export interface ScanRecord {
  id: string;
  risk: Risk;
  createdAt: string;
  origin: ScanOrigin;
  indicatorCount: number;
  characterCount: number;
}
export interface ScanResult extends ScanRecord {
  text: string;
  indicators: { title: string; description: string }[];
  domains: string[];
  advice: string;
  mode: "demo";
}
export interface Preferences {
  haptics: boolean;
  keepHistory: boolean;
  reduceMotion: boolean;
  notifications: boolean;
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
