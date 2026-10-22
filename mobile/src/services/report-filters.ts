import type { SmsMessage } from "./sms-service";
import type { Risk } from "../types/domain";
import { parseSmsReport } from "./sms-contract";

export type ReportRiskFilter = "all" | Risk;

/** Matches the outcome displayed on the card; offline findings remain provisional. */
export function reportRisk(message: SmsMessage): Risk {
  return parseSmsReport(message.report)?.risk ?? message.localRisk;
}

function searchText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase();
}

/** Local, in-memory search only. Preserve the inbox's newest-first order. */
export function filterReports(
  messages: readonly SmsMessage[],
  risk: ReportRiskFilter,
  query: string,
): SmsMessage[] {
  const needle = searchText(query.trim());
  return messages.filter(
    (message) =>
      (risk === "all" || reportRisk(message) === risk) &&
      (!needle ||
        searchText(message.sender).includes(needle) ||
        searchText(message.text).includes(needle)),
  );
}
