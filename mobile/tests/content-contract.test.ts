import test from "node:test";
import assert from "node:assert/strict";
import { parseLessons } from "../src/services/content-contract";

const lesson = {
  slug: "pause",
  title: "Pause",
  summary: "Take a moment.",
  category: "Safety",
  duration: 2,
  sections: [{ heading: "Stop", body: "Verify independently." }],
  question: "What next?",
  options: ["Pause", "Click"],
  correct_index: 0,
  explanation: "Pause first.",
  revision: 1,
};
test("published lesson contract maps staff API fields into app lessons", () => {
  const rows = parseLessons({ results: [lesson] });
  assert.equal(rows[0].id, "pause");
  assert.equal(rows[0].correctIndex, 0);
});
test("invalid quiz answers, malformed content and oversized releases are rejected", () => {
  assert.throws(() =>
    parseLessons({ results: [{ ...lesson, correct_index: 3 }] }),
  );
  assert.throws(() =>
    parseLessons({ results: [{ ...lesson, sections: ["not a section"] }] }),
  );
  assert.throws(() => parseLessons({ results: Array(51).fill(lesson) }));
});
