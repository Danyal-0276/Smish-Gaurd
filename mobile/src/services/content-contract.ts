import type { Lesson } from "../types/domain";

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const string = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;

export function parseLessons(data: unknown): Lesson[] {
  if (!object(data) || !Array.isArray(data.results) || data.results.length > 50)
    throw new Error("Published lessons have an unsupported format.");
  return data.results.map((row: unknown) => {
    if (
      !object(row) ||
      !string(row.slug, 60) ||
      !/^[a-zA-Z0-9_-]+$/.test(row.slug) ||
      !string(row.title, 120) ||
      !string(row.summary, 300) ||
      !string(row.category, 60) ||
      !Number.isInteger(row.duration) ||
      Number(row.duration) < 1 ||
      Number(row.duration) > 60 ||
      !Array.isArray(row.sections) ||
      row.sections.length > 20 ||
      !row.sections.every(
        (v) => object(v) && string(v.heading, 2000) && string(v.body, 2000),
      ) ||
      !string(row.question, 500) ||
      !Array.isArray(row.options) ||
      row.options.length < 2 ||
      row.options.length > 6 ||
      !row.options.every((v) => string(v, 500)) ||
      !Number.isInteger(row.correct_index) ||
      Number(row.correct_index) < 0 ||
      Number(row.correct_index) >= row.options.length ||
      !string(row.explanation, 2000)
    )
      throw new Error(
        "A published lesson has an unsupported format. Bundled lessons remain available.",
      );
    return {
      id: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category,
      duration: Number(row.duration),
      sections: row.sections as Lesson["sections"],
      question: row.question,
      options: row.options as string[],
      correctIndex: Number(row.correct_index),
      explanation: row.explanation,
    };
  });
}
