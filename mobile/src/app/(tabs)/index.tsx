import { View, Pressable } from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  Bell,
  ScanLine,
  ShieldCheck,
  Sparkles,
  LockKeyhole,
} from "lucide-react-native";
import {
  Screen,
  Txt,
  Card,
  Pill,
  SectionTitle,
  RecordRow,
  Enter,
  IconButton,
  Notice,
} from "../../components/ui";
import { BrandMark, ShieldIllustration } from "../../components/brand";
import { colors, fonts } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";

export default function Home() {
  const history = useAppStore((s) => s.history);
  const storageError = useAppStore((s) => s.storageError);
  const flagged = history.filter((r) => r.risk !== "low").length;
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <BrandMark size={30} />
          <Txt
            style={{
              fontFamily: fonts.extra,
              fontSize: 18,
              letterSpacing: -0.6,
            }}
          >
            smishguard
          </Txt>
        </View>
        <IconButton
          icon={Bell}
          label="Protection and notification setup"
          onPress={() => router.push("/permissions")}
        />
      </View>
      <Enter>
        <View style={{ gap: 10 }}>
          <Pill label="DEMO WORKSPACE" tone="amber" />
          <Txt variant="heading">
            A little clarity.{"\n"}For what comes next.
          </Txt>
          <Txt color={colors.muted}>Make space for a safer decision.</Txt>
        </View>
      </Enter>
      <Enter delay={80}>
        <View
          style={{
            backgroundColor: colors.forest,
            borderRadius: 30,
            padding: 24,
            overflow: "hidden",
            minHeight: 280,
          }}
        >
          <View
            style={{ position: "absolute", right: -60, top: -12, opacity: 0.8 }}
          >
            <ShieldIllustration />
          </View>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <View
              style={{
                width: 6,
                height: 6,
                backgroundColor: colors.lime,
                borderRadius: 3,
              }}
            />
            <Txt variant="label" color={colors.lime}>
              PAUSE. CHECK. PROCEED.
            </Txt>
          </View>
          <Txt
            style={{
              fontFamily: fonts.bold,
              fontSize: 26,
              lineHeight: 35,
              letterSpacing: -0.8,
              marginTop: 24,
              maxWidth: 220,
            }}
            color={colors.paper}
          >
            Not every text{"\n"}deserves a tap.
          </Txt>
          <Txt
            variant="small"
            color="#C7D8CB"
            style={{ maxWidth: 205, marginTop: 10 }}
          >
            Look at the message.{"\n"}Understand the warning signs.
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check a message"
            onPress={() => router.push("/(tabs)/scan")}
            style={({ pressed }) => ({
              backgroundColor: colors.lime,
              marginTop: 26,
              borderRadius: 16,
              minHeight: 50,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
            >
              <ScanLine size={19} color={colors.forestDark} />
              <Txt
                style={{ fontFamily: fonts.bold, fontSize: 13 }}
                color={colors.forestDark}
              >
                Check a message
              </Txt>
            </View>
            <ArrowUpRight size={18} color={colors.forestDark} />
          </Pressable>
        </View>
      </Enter>
      <Enter delay={140}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt variant="label" color={colors.muted}>
                DEMO CHECKS
              </Txt>
              <ShieldCheck size={16} color={colors.forest} />
            </View>
            <Txt variant="heading">
              {history.length.toString().padStart(2, "0")}
            </Txt>
            <Txt variant="small" color={colors.muted}>
              Stored on this device
            </Txt>
          </Card>
          <Card style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Txt variant="label" color={colors.muted}>
                TO REVIEW
              </Txt>
              <Sparkles size={16} color={colors.amber} />
            </View>
            <Txt variant="heading">{flagged.toString().padStart(2, "0")}</Txt>
            <Txt variant="small" color={colors.muted}>
              Simulated warnings
            </Txt>
          </Card>
        </View>
      </Enter>
      <View style={{ gap: 8 }}>
        <SectionTitle
          title="Recent activity"
          action="View all"
          onPress={() => router.push("/(tabs)/activity")}
        />
        {history.length ? (
          history
            .slice(0, 3)
            .map((r, i) => (
              <RecordRow
                record={r}
                key={r.id}
                last={i === Math.min(history.length, 3) - 1}
              />
            ))
        ) : (
          <Card>
            <Txt color={colors.muted}>
              A fresh start. Your next check will appear here if local history
              is enabled.
            </Txt>
          </Card>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/lesson/pause")}
        style={{
          backgroundColor: "#E9EBDD",
          borderRadius: 22,
          padding: 20,
          gap: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Txt variant="label" color={colors.forest}>
            A SMALL SAFETY HABIT
          </Txt>
          <ArrowUpRight size={18} color={colors.forest} />
        </View>
        <Txt variant="title">Urgency is a reason to pause.</Txt>
        <Txt variant="small" color={colors.muted}>
          An account warning can wait while you open the official app yourself.
        </Txt>
      </Pressable>
      <Notice icon={LockKeyhole}>
        {storageError
          ? "Local storage is unavailable. Changes may not survive a restart."
          : "No account. No inbox upload. This demo does not read your SMS or provide live protection."}
      </Notice>
    </Screen>
  );
}
