export type Risk = "low" | "review" | "high";
export interface Preferences { haptics: boolean; reduceMotion: boolean }
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
