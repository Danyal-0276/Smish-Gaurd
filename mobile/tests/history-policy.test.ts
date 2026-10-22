import test from "node:test";
import assert from "node:assert/strict";
import { retainHistory, toMetadata } from "../src/services/history-policy";
import { inspectDemoText } from "../src/features/scan/demo-engine";

test("saved metadata excludes message, URLs, explanations and credentials", () => {
  const result = inspectDemoText(
    "PRIVATE_CANARY https://example.invalid/secret",
    "synthetic",
    new Date().toISOString(),
  );
  const saved = JSON.stringify(toMetadata(result));
  assert.ok(!saved.includes("PRIVATE_CANARY"));
  assert.ok(!saved.includes("example.invalid"));
  assert.ok(!saved.includes('"text"'));
  assert.ok(!saved.includes('"domains"'));
});
test("retention expires old and malformed records while bounding saved history", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");
  const base = toMetadata(
    inspectDemoText("Synthetic message", "new", new Date(now).toISOString()),
  );
  const old = {
    ...base,
    id: "old",
    createdAt: new Date(now - 31 * 86400000).toISOString(),
  };
  const bad = { ...base, id: "bad", createdAt: "invalid" };
  assert.deepEqual(
    retainHistory([old, bad, base], now).map((r) => r.id),
    ["new"],
  );
  assert.equal(
    retainHistory(
      Array.from({ length: 250 }, (_, i) => ({ ...base, id: String(i) })),
      now,
    ).length,
    200,
  );
});
