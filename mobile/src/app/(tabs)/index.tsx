import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  ScanLine,
  LockKeyhole,
  ShieldCheck,
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
import { BrandMark } from "../../components/brand";
import { colors, fonts } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";

export default function Home() {
  const history = useAppStore((s) => s.history);
  const storageError = useAppStore((s) => s.storageError);
  const online = useAppStore((s) => s.preferences.cloudAnalysis) ?? false;
  const flagged = history.filter((r) => r.risk !== "low").length;
  return (
    <Screen style={{ gap: 28 }}>
      <View style={styles.between}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <BrandMark size={31} />
          <Txt
            style={{
              fontFamily: fonts.extra,
              fontSize: 19,
              letterSpacing: -0.8,
            }}
          >
            smishguard
          </Txt>
        </View>
        <IconButton
          icon={ShieldCheck}
          label="Protection status"
          onPress={() => router.push("/permissions")}
        />
      </View>
      <Enter>
        <View style={{ gap: 12 }}>
          <Pill label={online ? "SMS SAFETY · ONLINE MODE" : "SMS SAFETY · DEMO"} />
          <Txt variant="display" style={styles.headline}>
            Think before{"\n"}you{" "}
            <Txt variant="display" color={colors.brand} style={styles.headline}>
              tap.
            </Txt>
          </Txt>
          <Txt color={colors.muted}>Unexpected text? Take a closer look.</Txt>
        </View>
      </Enter>
      <Enter delay={60}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.watermark}>
            <BrandMark size={170} color="#FFFFFF" />
          </View>
          <View style={styles.between}>
            <Txt variant="label" color={colors.onDark}>
              01 / MESSAGE CHECK
            </Txt>
            <ScanLine size={22} color={colors.paper} strokeWidth={1.5} />
          </View>
          <Txt color={colors.paper} style={styles.heroTitle}>
            A safer next step{"\n"}starts here.
          </Txt>
          <Txt color={colors.onDark} style={{ maxWidth: 220, fontSize: 13 }}>
            Paste a text. Explore the signs. Choose what to do next.
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check a message"
            onPress={() => router.push("/(tabs)/scan")}
            style={({ pressed }) => [
              styles.cta,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
              Check a message
            </Txt>
            <ArrowUpRight size={19} color={colors.ink} />
          </Pressable>
        </View>
      </Enter>
      <Enter delay={120}>
        <View style={styles.metrics}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt style={styles.number}>
              {String(history.length).padStart(2, "0")}
            </Txt>
            <Txt variant="small" color={colors.muted}>
              Local checks
            </Txt>
          </View>
          <View style={{ width: 1, backgroundColor: colors.line }} />
          <View style={{ flex: 1, gap: 4, paddingLeft: 24 }}>
            <Txt style={styles.number}>{String(flagged).padStart(2, "0")}</Txt>
            <Txt variant="small" color={colors.muted}>
              Saved warnings
            </Txt>
          </View>
        </View>
      </Enter>
      <View style={{ gap: 8 }}>
        <SectionTitle
          title="Recent checks"
          action="View all"
          onPress={() => router.push("/(tabs)/activity")}
        />
        {history.length ? (
          history
            .slice(0, 3)
            .map((record, index) => (
              <RecordRow
                key={record.id}
                record={record}
                last={index === Math.min(history.length, 3) - 1}
              />
            ))
        ) : (
          <Card>
            <Txt color={colors.muted}>Your saved checks will appear here.</Txt>
          </Card>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/lesson/pause")}
        style={({ pressed }) => [styles.lesson, { opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={styles.between}>
          <Txt variant="label" color={colors.accent}>
            ONE GOOD HABIT
          </Txt>
          <ArrowUpRight size={20} color={colors.paper} />
        </View>
        <Txt variant="title" color={colors.paper}>
          If it feels urgent, pause.
        </Txt>
        <Txt variant="small" color="#BBC0CE">
          Open the official app yourself before you act.
        </Txt>
      </Pressable>
      <Notice icon={LockKeyhole}>
        {storageError
          ? "Storage is unavailable. Changes may not survive a restart."
          : online ? "Online checks send selected text to our backend. No SMS inbox access or automatic protection." : "Demo checks only. No SMS access or live protection. Your text stays in this session."}
      </Notice>
    </Screen>
  );
}
const styles = StyleSheet.create({
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headline: { fontSize: 43, lineHeight: 49, letterSpacing: -2.2 },
  hero: {
    backgroundColor: colors.brand,
    padding: 23,
    borderRadius: 24,
    overflow: "hidden",
    gap: 16,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -1.1,
  },
  watermark: {
    position: "absolute",
    right: -24,
    top: 36,
    opacity: 0.09,
    transform: [{ rotate: "-12deg" }],
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingHorizontal: 19,
    minHeight: 49,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    marginTop: 2,
  },
  metrics: {
    flexDirection: "row",
    paddingVertical: 4,
    alignItems: "center",
    gap: 15,
  },
  number: {
    fontFamily: fonts.extra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -1,
  },
  lesson: {
    backgroundColor: colors.night,
    borderRadius: 21,
    padding: 22,
    gap: 12,
  },
});
