import { router } from "expo-router";
import { View, Pressable } from "react-native";
import { Eye, Fingerprint, ShieldCheck } from "lucide-react-native";
import { Screen, Txt, Button, Enter, Pill } from "../components/ui";
import { BrandMark, ShieldIllustration } from "../components/brand";
import { colors, fonts } from "../theme/tokens";

export default function Welcome() {
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
          Scan your inbox, check new arrivals, and receive model reports when
          connected.
        </Txt>
      </Enter>
      <View style={{ gap: 15 }}>
        {[
          { Icon: Eye, text: "Real SMS, immediate offline observations." },
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
            router.push("/permissions");
          }}
        />
        <Txt
          variant="small"
          color={colors.muted}
          style={{ textAlign: "center" }}
        >
          Next, choose your permissions and whether pending messages may be sent
          automatically for model analysis.
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
