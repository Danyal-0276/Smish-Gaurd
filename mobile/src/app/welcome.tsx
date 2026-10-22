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
        <Pill label="SMS SAFETY" />
      </View>
      <Enter>
        <View
          style={{
            backgroundColor: colors.brand,
            borderRadius: 32,
            paddingVertical: 22,
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <ShieldIllustration />
          <Txt variant="label" color={colors.paper} style={{ marginTop: 2 }}>
            PAUSE. CHECK. DECIDE.
          </Txt>
        </View>
      </Enter>
      <Enter delay={100}>
        <Txt variant="display">
          A text arrives.{"\n"}
          <Txt variant="display" color={colors.brand}>
            You stay in control.
          </Txt>
        </Txt>
        <Txt color={colors.muted} style={{ marginTop: 14 }}>
          Learn the signs of SMS phishing, explore a message, and make an
          informed next move.
        </Txt>
      </Enter>
      <View style={{ gap: 15 }}>
        {[
          { Icon: Eye, text: "Clear reasons behind each demo result." },
          { Icon: Fingerprint, text: "No account. No phone number required." },
          { Icon: ShieldCheck, text: "Your history stays on this device." },
        ].map(({ Icon, text }) => (
          <View
            key={text}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <Icon size={18} color={colors.brand} strokeWidth={1.7} />
            <Txt style={{ fontSize: 13 }}>{text}</Txt>
          </View>
        ))}
      </View>
      <View style={{ gap: 14 }}>
        <Button
          label="Get started"
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
          Start with local demo checks. Online model checks are optional and ask
          for consent. Incoming SMS protection is not connected yet.
        </Txt>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/privacy")}
        >
          <Txt
            variant="small"
            color={colors.brand}
            style={{ textAlign: "center", textDecorationLine: "underline" }}
          >
            Read the privacy notes
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
