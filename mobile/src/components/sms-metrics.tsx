import { View } from "react-native";
import { Card, Txt } from "./ui";
import { colors, fonts } from "../theme/tokens";
import type { SmsStatus } from "../services/sms-service";
export function SmsMetrics({ status }: { status: SmsStatus }) {
  const segments = [
    { label: "High risk", count: status.modelHigh, color: "#B42332" },
    { label: "Review", count: status.modelReview, color: colors.accent },
    { label: "Low risk", count: status.modelLow, color: colors.brand },
  ];
  const max = Math.max(1, ...status.days.map((day) => day.count));
  return (
    <Card style={{ gap: 20 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Txt variant="title">Your model reports</Txt>
        <Txt variant="small" color={colors.muted}>
          {status.completed} ready
        </Txt>
      </View>
      <View
        style={{
          height: 10,
          flexDirection: "row",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: colors.line,
        }}
      >
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <View
              key={s.label}
              style={{ flex: s.count, backgroundColor: s.color }}
            />
          ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {segments.map((s) => (
          <View key={s.label} style={{ gap: 5 }}>
            <Txt
              style={{ fontFamily: fonts.extra, fontSize: 26, lineHeight: 32 }}
            >
              {s.count}
            </Txt>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: s.color,
                }}
              />
              <Txt variant="small" color={colors.muted}>
                {s.label}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <Txt variant="label" color={colors.muted}>
        REPORTS COMPLETED · LAST 7 DAYS
      </Txt>
      <View
        accessibilityLabel={status.days
          .map((d) => d.day + ": " + d.count + " reports")
          .join(", ")}
        style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}
      >
        {status.days.map((day, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Txt variant="small" color={colors.muted}>
              {day.count}
            </Txt>
            <View
              style={{ height: 64, width: "100%", justifyContent: "flex-end" }}
            >
              <View
                style={{
                  height: day.count ? Math.max(5, (day.count / max) * 64) : 2,
                  backgroundColor: day.count ? colors.brand : colors.line,
                  borderRadius: 5,
                }}
              />
            </View>
            <Txt variant="small" color={colors.muted} numberOfLines={1}>
              {day.day.slice(0, 2)}
            </Txt>
          </View>
        ))}
      </View>
      <Txt variant="small" color={colors.muted}>
        Based on retained reports on this phone. Risk levels are assessments,
        not confirmed scams.
      </Txt>
    </Card>
  );
}
