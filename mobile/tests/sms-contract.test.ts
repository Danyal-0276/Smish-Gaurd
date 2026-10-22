import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSmsReport,
  queueLabel,
  resultCopy,
  localReasons,
} from "../src/services/sms-contract";

test("queued and unsupported checks never become model verdicts", () => {
  assert.equal(parseSmsReport(null), null);
  assert.equal(parseSmsReport('{"status":"unsupported","risk":null}'), null);
  assert.equal(parseSmsReport('{"status":"completed","risk":"low"}'), null);
  assert.match(queueLabel("pending"), /queued/);
  assert.match(queueLabel("unsupported"), /No model verdict/);
});
test("feedback matches risk and does not label offline rules as a trained model", () => {
  assert.match(resultCopy("high", true).title, /phishing/);
  assert.doesNotMatch(resultCopy("high", false).title, /phishing/);
  assert.match(resultCopy("high", true).action, /Don’t tap/);
  assert.match(resultCopy("review", true).action, /Contact/);
  assert.doesNotMatch(resultCopy("low", true).title, /safe/i);
});
test("malformed native explanations do not crash report rendering", () => {
  assert.deepEqual(localReasons("not json"), []);
  assert.deepEqual(localReasons('["A link",null,5,{"text":"invalid"}]'), [
    "A link",
  ]);
});
