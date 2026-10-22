import { router } from "expo-router";
import { View, Pressable } from "react-native";
import { Eye, Fingerprint, ShieldCheck } from "lucide-react-native";
import { Screen, Txt, Button, Enter, Pill } from "../components/ui";
import { BrandMark, ShieldIllustration } from "../components/brand";
import { colors, fonts } from "../theme/tokens";
import { useAppStore } from "../store/app-store";

export default function Welcome() {
  const finish = useAppStore((s) => s.finishOnboarding);
  return (
    <Screen style={{ gap: 28, paddingBottom: 44 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BrandMark size={27} />
          <Txt style={{ fontFamily: fonts.extra }}>smishguard</Txt>
        </View>
        <Pill label="A thoughtful little guard" />
      </View>
      <Enter>
        <View
          style={{
            backgroundColor: colors.forest,
            borderRadius: 32,
            paddingVertical: 22,
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <ShieldIllustration />
          <Txt variant="label" color={colors.lime} style={{ marginTop: 2 }}>
            YOUR NEXT TAP, WITH CONFIDENCE
          </Txt>
        </View>
      </Enter>
      <Enter delay={100}>
        <Txt variant="display">A little clarity.{"\n"}Before you tap.</Txt>
        <Txt color={colors.muted} style={{ marginTop: 14 }}>
          A calmer way to look at unexpected texts. Understand the warning
          signs, then decide your next step.
        </Txt>
      </Enter>
      <View style={{ gap: 15 }}>
        {[
          { Icon: Eye, text: "Understand the signs, not just a score." },
          { Icon: Fingerprint, text: "No account. No phone number required." },
          { Icon: ShieldCheck, text: "Your history stays on this device." },
        ].map(({ Icon, text }) => (
          <View
            key={text}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Icon size={18} color={colors.forest} strokeWidth={1.7} />
            <Txt style={{ fontSize: 13 }}>{text}</Txt>
          </View>
        ))}
      </View>
      <View style={{ gap: 14 }}>
        <Button
          label="Let’s take a look"
          onPress={() => {
            finish();
            router.replace("/(tabs)");
          }}
        />
        <Txt
          variant="small"
          color={colors.muted}
          style={{ textAlign: "center" }}
        >
          You’re exploring a demo. Checks are simulated; live SMS protection is
          not connected.
        </Txt>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/privacy")}
        >
          <Txt
            variant="small"
            color={colors.forest}
            style={{ textAlign: "center", textDecorationLine: "underline" }}
          >
            How we approach your privacy
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
