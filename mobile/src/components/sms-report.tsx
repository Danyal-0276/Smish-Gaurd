import { useState } from "react";
import { View, Pressable } from "react-native";
import {
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  CircleHelp,
  Trash2,
} from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Card, Txt, ConfirmSheet } from "./ui";
import { colors, fonts } from "../theme/tokens";
import {
  refreshSms,
  smsNative,
  type SmsMessage,
} from "../services/sms-service";
import {
  parseSmsReport,
  localReasons,
  queueLabel,
  resultCopy,
} from "../services/sms-contract";
export function SmsReport({
  message,
  onDelete,
}: {
  message: SmsMessage;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const report = parseSmsReport(message.report);
  const risk = report?.risk ?? message.localRisk;
  const copy = resultCopy(risk, Boolean(report));
  const background =
    risk === "high"
      ? "#B42332"
      : risk === "review"
        ? colors.accent
        : colors.brand;
  const foreground = risk === "review" ? colors.ink : colors.paper;
  const Icon =
    risk === "high"
      ? ShieldAlert
      : risk === "review"
        ? CircleHelp
        : ShieldCheck;
  return (
    <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
      <View style={{ padding: 20, gap: 5 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Txt variant="title" numberOfLines={1} style={{ flex: 1 }}>
            {message.sender}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete local report"
            hitSlop={12}
            onPress={() => setConfirm(true)}
          >
            <Trash2 size={18} color={colors.muted} />
          </Pressable>
        </View>
        <Txt variant="small" color={colors.muted}>
          {message.source === "incoming"
            ? "New arrival"
            : message.source === "existing"
              ? "Existing SMS"
              : "Pasted message"}{" "}
          · {new Date(message.received).toLocaleString()}
        </Txt>
      </View>
      <View
        style={{
          marginHorizontal: 8,
          borderRadius: 21,
          padding: 22,
          gap: 14,
          backgroundColor: background,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Txt variant="label" color={foreground}>
            {report ? "MODEL ASSESSMENT" : "OFFLINE CHECK"}
          </Txt>
          <Icon color={foreground} size={26} strokeWidth={1.7} />
        </View>
        <Txt
          variant="heading"
          color={foreground}
          style={{ fontSize: 30, lineHeight: 36 }}
        >
          {copy.title}
        </Txt>
        <View
          style={{ height: 1, backgroundColor: foreground, opacity: 0.25 }}
        />
        <Txt
          color={foreground}
          style={{ fontFamily: fonts.bold, fontSize: 14 }}
        >
          {copy.action}
        </Txt>
      </View>
      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor:
                message.state === "completed" ? colors.brand : colors.amber,
            }}
          />
          <Txt variant="small" color={colors.muted} style={{ flex: 1 }}>
            {queueLabel(message.state)}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
          style={{ gap: 5 }}
        >
          <Txt numberOfLines={expanded ? undefined : 2}>{message.text}</Txt>
          <Txt variant="small" color={colors.brand}>
            {expanded ? "Show less" : "Read full message"}
          </Txt>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: details }}
          onPress={() => setDetails(!details)}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
            Why this result
          </Txt>
          <ChevronDown
            size={18}
            color={colors.muted}
            style={{ transform: [{ rotate: details ? "180deg" : "0deg" }] }}
          />
        </Pressable>
        {details && (
          <Animated.View entering={FadeIn.duration(180)} style={{ gap: 12 }}>
            {report && (
              <>
                <Txt variant="label" color={colors.brand}>
                  MODEL OBSERVATIONS
                </Txt>
                {report.indicators.length ? (
                  report.indicators.map((item, i) => (
                    <View key={i} style={{ gap: 3 }}>
                      <Txt variant="small" style={{ fontFamily: fonts.bold }}>
                        {item.title}
                      </Txt>
                      <Txt variant="small" color={colors.muted}>
                        {item.description}
                      </Txt>
                    </View>
                  ))
                ) : (
                  <Txt variant="small" color={colors.muted}>
                    No explanatory rule was recorded. The classifier uses
                    learned text patterns; these observations do not explain its
                    exact decision.
                  </Txt>
                )}
              </>
            )}
            <Txt variant="label" color={colors.muted}>
              OFFLINE OBSERVATIONS · {message.localRisk.toUpperCase()}
            </Txt>
            {localReasons(message.reasons).length ? (
              localReasons(message.reasons).map((reason) => (
                <Txt key={reason} variant="small" color={colors.muted}>
                  {reason}
                </Txt>
              ))
            ) : (
              <Txt variant="small" color={colors.muted}>
                No configured English rule matched.
              </Txt>
            )}
            {report && (
              <Txt variant="small" color={colors.muted}>
                Model: {report.model_version}
              </Txt>
            )}
            <Txt variant="small" color={colors.muted}>
              English-oriented checks. No link was visited or sender verified.
            </Txt>
          </Animated.View>
        )}
        <Txt variant="small" color={colors.muted}>
          Checks can miss scams. Verify unexpected requests.
        </Txt>
      </View>
      {!!error && <Txt color={colors.danger}>{error}</Txt>}
      <ConfirmSheet
        visible={confirm}
        title="Delete local report?"
        body="Remove this app’s message copy and pending check. Your original SMS stays in your messaging app. A request already sent cannot be recalled."
        confirmLabel="Delete report"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          void smsNative()
            .deleteMessage(message.id)
            .then(async () => {
              await refreshSms();
              onDelete();
            })
            .catch(() => setError("Could not delete this report."));
        }}
      />
    </Card>
  );
}
