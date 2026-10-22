import test from "node:test";
import assert from "node:assert/strict";
import type { SmsMessage } from "../src/services/sms-service";
import { filterReports, reportRisk } from "../src/services/report-filters";

const message = (id: string, extra: Partial<SmsMessage> = {}): SmsMessage => ({
  id,
  thread: "thread",
  sender: "+923001234567",
  text: "Meet at the library",
  received: 100,
  source: "existing",
  localRisk: "low",
  reasons: "[]",
  state: "pending",
  report: null,
  ...extra,
});
const model = (risk: string) =>
  JSON.stringify({
    request_id: "request",
    status: "completed",
    mode: "backend_model",
    risk,
    model_version: "test-model",
    policy_version: "1",
    coverage: "English",
    indicators: [],
    domains: [],
    advice: "Verify unexpected requests.",
  });

test("risk filters follow the displayed model result ahead of offline findings", () => {
  const rows = [
    message("low"),
    message("high", {
      localRisk: "low",
      state: "completed",
      report: model("high"),
    }),
    message("review", { localRisk: "review" }),
  ];
  assert.deepEqual(
    filterReports(rows, "high", "").map((m) => m.id),
    ["high"],
  );
  assert.deepEqual(
    filterReports(rows, "review", "").map((m) => m.id),
    ["review"],
  );
  assert.deepEqual(
    filterReports(rows, "low", "").map((m) => m.id),
    ["low"],
  );
  assert.equal(
    reportRisk(
      message("override", {
        localRisk: "high",
        state: "completed",
        report: model("low"),
      }),
    ),
    "low",
  );
});
test("case-insensitive search matches message text and sender and combines with risk", () => {
  const rows = [
    message("bank", {
      sender: "Campus Bank",
      localRisk: "high",
      text: "Verify your account",
    }),
    message("phone"),
    message("review", { sender: "Campus Bank", localRisk: "review" }),
  ];
  assert.deepEqual(
    filterReports(rows, "all", "  campus BANK ").map((m) => m.id),
    ["bank", "review"],
  );
  assert.deepEqual(
    filterReports(rows, "high", "verify").map((m) => m.id),
    ["bank"],
  );
  assert.deepEqual(
    filterReports(rows, "all", "1234567").map((m) => m.id),
    ["phone"],
  );
  assert.deepEqual(filterReports(rows, "low", "verify"), []);
});
test("blank search preserves order and treats special search characters literally", () => {
  const rows = [message("newest"), message("older")];
  assert.deepEqual(
    filterReports(rows, "all", " \n ").map((m) => m.id),
    ["newest", "older"],
  );
  assert.deepEqual(filterReports(rows, "all", ".*"), []);
  assert.deepEqual(
    rows.map((m) => m.id),
    ["newest", "older"],
  );
});
test("unsupported and malformed model reports retain honest offline filtering", () => {
  assert.equal(
    reportRisk(
      message("unsupported", {
        localRisk: "review",
        state: "unsupported",
        report: '{"status":"unsupported","risk":null}',
      }),
    ),
    "review",
  );
  assert.equal(
    reportRisk(message("bad", { localRisk: "high", report: "invalid JSON" })),
    "high",
  );
});
test("Unicode search normalizes equivalent text and can find non-English messages", () => {
  const rows = [message("unicode", { text: "Cafe\u0301 — السلام علیکم" })];
  assert.equal(filterReports(rows, "all", "CAFÉ").length, 1);
  assert.equal(filterReports(rows, "all", "السلام").length, 1);
});
