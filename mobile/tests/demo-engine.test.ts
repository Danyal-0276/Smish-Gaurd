import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectDemoText } from "../src/features/scan/demo-engine";

test("demo rejects invalid input instead of returning low risk", () => {
  assert.throws(() => inspectDemoText("   ", "test", new Date().toISOString()));
  assert.throws(() =>
    inspectDemoText("x".repeat(5001), "test", new Date().toISOString()),
  );
});
test("demo preserves explicit mode and does not claim model confidence", () => {
  const result = inspectDemoText(
    "Urgent: verify your account at https://example.invalid/test",
    "test",
    "2026-10-22T10:00:00Z",
  );
  assert.equal(result.risk, "high");
  assert.equal(result.mode, "demo");
  assert.equal("confidence" in result, false);
  assert.deepEqual(result.domains, ["example.invalid"]);
});
test("a link alone is a review signal, not a phishing guarantee", () => {
  assert.equal(
    inspectDemoText("See https://example.invalid", "test", "now").risk,
    "review",
  );
});
