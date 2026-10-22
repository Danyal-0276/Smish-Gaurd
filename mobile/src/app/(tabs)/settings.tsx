import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  Fingerprint,
  Bell,
  Vibrate,
  Wind,
  Clock3,
  Trash2,
  RotateCcw,
  Info,
  ShieldCheck,
} from "lucide-react-native";
import {
  Screen,
  Txt,
  Card,
  Pill,
  SettingRow,
  ConfirmSheet,
  Notice,
} from "../../components/ui";
import { BrandMark } from "../../components/brand";
import { colors, fonts } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";

export default function Settings() {
  const preferences = useAppStore((s) => s.preferences);
  const update = useAppStore((s) => s.updatePreferences);
  const clear = useAppStore((s) => s.clearHistory);
  const reset = useAppStore((s) => s.resetDemo);
  const [confirm, setConfirm] = useState<"clear" | "reset" | null>(null);
  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Txt variant="label" color={colors.muted}>
          YOUR PREFERENCES
        </Txt>
        <Txt variant="heading">Make it yours.</Txt>
      </View>
      <Card style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <BrandMark size={43} tile />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">No account needed.</Txt>
          <Txt variant="small" color={colors.muted}>
            No profile to create. No phone number to share.
          </Txt>
        </View>
      </Card>
      <View style={{ gap: 10 }}>
        <Txt variant="label" color={colors.muted}>
          YOUR EXPERIENCE
        </Txt>
        <Card style={{ paddingVertical: 4 }}>
          <SettingRow
            icon={Vibrate}
            title="Tap feedback"
            description="Light vibrations on supported devices"
            value={preferences.haptics}
            onChange={(v) => update({ haptics: v })}
          />
          <SettingRow
            icon={Wind}
            title="Less motion"
            description="Keep transitions simple"
            value={preferences.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
          <SettingRow
            icon={Clock3}
            title="Keep check history"
            description="Store result metadata on this device"
            value={preferences.keepHistory}
            onChange={(v) => update({ keepHistory: v })}
          />
        </Card>
      </View>
      <View style={{ gap: 10 }}>
        <Txt variant="label" color={colors.muted}>
          PRIVACY & PROTECTION
        </Txt>
        <Card style={{ paddingVertical: 4 }}>
          <SettingRow
            icon={ShieldCheck}
            title="Protection setup"
            description="What’s available in this demo"
            onPress={() => router.push("/permissions")}
          />
          <SettingRow
            icon={Fingerprint}
            title="Your privacy"
            description="What stays here, and what doesn’t"
            onPress={() => router.push("/privacy")}
          />
          <SettingRow
            icon={Bell}
            title="SMS & notifications"
            description="Not connected in this build"
            onPress={() => router.push("/permissions")}
          />
        </Card>
      </View>
      <View style={{ gap: 10 }}>
        <Txt variant="label" color={colors.muted}>
          ON THIS DEVICE
        </Txt>
        <Card style={{ paddingVertical: 4 }}>
          <SettingRow
            icon={Trash2}
            title="Clear local history"
            description="Does not delete your SMS inbox"
            danger
            onPress={() => setConfirm("clear")}
          />
          <SettingRow
            icon={RotateCcw}
            title="Restore sample checks"
            description="Replace history with the demo examples"
            onPress={() => setConfirm("reset")}
          />
          <SettingRow
            icon={Info}
            title="See the introduction"
            onPress={() => router.push("/welcome")}
          />
        </Card>
      </View>
      <View style={{ alignItems: "center", gap: 9, paddingVertical: 12 }}>
        <BrandMark size={26} />
        <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
          smishguard · 0.1.0
        </Txt>
        <Pill label="UNIVERSITY DEMONSTRATION" />
        <Txt variant="small" color={colors.muted}>
          Made for a more thoughtful next step.
        </Txt>
      </View>
      <Notice>
        Cloud analysis, real SMS access, and account credentials are not used by
        this frontend demo.
      </Notice>
      <ConfirmSheet
        visible={confirm !== null}
        title={
          confirm === "clear"
            ? "Clear local history?"
            : "Restore sample checks?"
        }
        body={
          confirm === "clear"
            ? "Remove stored check metadata and session results from this device."
            : "Replace the current local history with four fictional sample checks. Your settings and learning progress stay as they are."
        }
        confirmLabel={confirm === "clear" ? "Clear history" : "Restore samples"}
        onClose={() => setConfirm(null)}
        onConfirm={confirm === "clear" ? clear : reset}
      />
    </Screen>
  );
}
