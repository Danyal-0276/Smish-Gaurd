import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import { Txt } from "./ui";
import { colors, fonts } from "../theme/tokens";
import { useAppStore } from "../store/app-store";
import type { SmsStatus } from "../services/sms-service";

function ActivityBar({
  height,
  selected,
}: {
  height: number;
  selected: boolean;
}) {
  const value = useSharedValue(0);
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  useEffect(() => {
    value.value =
      reduced || systemReduced ? height : withTiming(height, { duration: 460 });
  }, [height, reduced, systemReduced, value]);
  const style = useAnimatedStyle(() => ({ height: value.value }));
  return (
    <Animated.View
      style={[
        {
          width: "100%",
          backgroundColor: selected ? colors.accent : colors.brand,
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
        },
        style,
      ]}
    />
  );
}

export function HomeActivity({ status }: { status: SmsStatus | null }) {
  const [selected, setSelected] = useState<number | null>(null);
  const days = status?.days ?? [];
  const picked = selected === null ? undefined : days[selected];
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <View
      style={{
        backgroundColor: colors.night,
        borderRadius: 26,
        padding: 22,
        gap: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Txt variant="label" color={colors.dockMuted}>
          MODEL ACTIVITY
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all reports"
          onPress={() => router.push("/(tabs)/activity")}
          style={{
            minWidth: 44,
            minHeight: 36,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <ArrowUpRight color={colors.paper} size={20} />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Txt
          accessibilityLiveRegion="polite"
          color={colors.paper}
          style={{
            fontFamily: fonts.extra,
            fontSize: 42,
            lineHeight: 50,
            letterSpacing: -1.8,
          }}
        >
          {status ? (picked?.count ?? total).toLocaleString() : "—"}
        </Txt>
        <Txt variant="small" color={colors.dockMuted}>
          {picked ? `reports on ${picked.day}` : "reports in the last 7 days"}
        </Txt>
      </View>
      {!!days.length && (
        <View style={{ gap: 10 }}>
          <View style={{ position: "relative", height: 104 }}>
            {[0, 0.5, 1].map((line) => (
              <View
                key={line}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: line * 96,
                  height: 1,
                  backgroundColor: "#30323A",
                }}
              />
            ))}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                height: 104,
                alignItems: "flex-end",
              }}
            >
              {days.map((day, index) => (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.day}: ${day.count} model reports`}
                  accessibilityState={{ selected: selected === index }}
                  onPress={() => setSelected(selected === index ? null : index)}
                  style={{ flex: 1, height: 104, justifyContent: "flex-end" }}
                >
                  <ActivityBar
                    height={(day.count / max) * 96}
                    selected={selected === index}
                  />
                  {!day.count && (
                    <View
                      style={{
                        height: 3,
                        backgroundColor:
                          selected === index ? colors.accent : "#515562",
                        borderRadius: 2,
                      }}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {days.map((day, index) => (
              <Txt
                key={index}
                variant="small"
                color={selected === index ? colors.accent : colors.dockMuted}
                style={{ flex: 1, textAlign: "center" }}
              >
                {day.day.slice(0, 2)}
              </Txt>
            ))}
          </View>
        </View>
      )}
      <Txt variant="small" color={colors.dockMuted}>
        {!status
          ? "Allow SMS access to start your activity view."
          : total === 0
            ? "Your first completed model check will appear here."
            : "Tap a day to explore. Counts use retained reports."}
      </Txt>
    </View>
  );
}
