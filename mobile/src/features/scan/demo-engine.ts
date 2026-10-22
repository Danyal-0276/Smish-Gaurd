import type { ScanResult } from "../../types/domain";

/** UI simulation only. This is not the trained classifier or a security verdict. */
export function inspectDemoText(
  text: string,
  id: string,
  createdAt: string,
): ScanResult {
  if (!text.trim()) throw new Error("Add a message before checking it.");
  if (text.length > 5000)
    throw new Error("Keep your message under 5,000 characters.");
  const indicators: ScanResult["indicators"] = [];
  const urgency =
    /\b(urgent|immediately|suspended|suspend|expires|blocked)\b/i.test(text);
  const sensitive =
    /\b(password|otp|pin|verify|bank|payment|account|prize|claim)\b/i.test(
      text,
    );
  const links = text.match(/(?:https?:\/\/|www\.)[^\s<>]+/gi) ?? [];
  const domains = [
    ...new Set(
      links.map((link) => {
        try {
          return new URL(link.startsWith("www.") ? `https://${link}` : link)
            .hostname;
        } catch {
          return "Unrecognized link";
        }
      }),
    ),
  ];
  if (urgency)
    indicators.push({
      title: "Pressure to act quickly",
      description:
        "Urgent wording can discourage you from pausing to verify a request.",
    });
  if (sensitive)
    indicators.push({
      title: "A sensitive request",
      description:
        "The message mentions account access, money, a prize, or verification. Check the context independently.",
    });
  if (links.length)
    indicators.push({
      title: "An external destination",
      description:
        "This demo detects a link. Its presence alone does not establish that the message is malicious.",
    });
  const risk =
    indicators.length >= 2
      ? "high"
      : indicators.length === 1
        ? "review"
        : "low";
  return {
    id,
    createdAt,
    risk,
    text,
    indicators,
    domains,
    mode: "demo",
    origin: "manual-demo",
    indicatorCount: indicators.length,
    characterCount: text.length,
    advice:
      risk === "low"
        ? "No demo patterns were found. Confirm unexpected requests with the sender through a known channel."
        : "Pause before replying. Contact the organization through its official app or a number you already know.",
  };
}

export const sampleMessages = [
  {
    label: "Account alert",
    description: "Urgency + verification",
    text: "URGENT: Your account has been suspended. Verify your password now at https://account-check.example.invalid/verify",
  },
  {
    label: "Delivery update",
    description: "A payment request",
    text: "Your parcel is on hold. Complete a small payment at https://parcel.example.invalid/update to arrange delivery.",
  },
  {
    label: "Everyday message",
    description: "A simple conversation",
    text: "Hey, are we still meeting at the library at 4? I will bring the notes.",
  },
];
