import { View } from "react-native";
import {
  Fingerprint,
  Smartphone,
  CloudOff,
  LockKeyhole,
} from "lucide-react-native";
import { Screen, Txt, BackHeader, Card, Pill, Button } from "../components/ui";
import { router } from "expo-router";
import { colors } from "../theme/tokens";
export default function Privacy() {
  return (
    <Screen>
      <BackHeader title="Your privacy" />
      <Pill label="PRIVATE BY DEFAULT" />
      <Txt variant="heading">Less collected.{"\n"}More peace of mind.</Txt>
      {[
        {
          Icon: Fingerprint,
          title: "You don’t need a profile.",
          body: "This app does not ask for your name, email, phone number, SIM serial, or contacts.",
        },
        {
          Icon: Smartphone,
          title: "Your history lives here.",
          body: "Only check metadata, preferences, and lesson progress are saved on this device. Text you enter stays in session memory, not saved history.",
        },
        {
          Icon: CloudOff,
          title: "Online analysis is your choice.",
          body: "Demo checks stay local. If you enable the online model, text you deliberately check is sent to our Django backend for transient analysis. It is not saved in its database or used to retrain the model. Links are not opened.",
        },
        {
          Icon: LockKeyhole,
          title: "You stay in control.",
          body: "Turn history off for future checks or clear existing history in Settings. Clearing app history never deletes messages from your SMS inbox.",
        },
      ].map(({ Icon, title, body }) => (
        <View key={title} style={{ gap: 9 }}>
          <Icon size={23} color={colors.brand} strokeWidth={1.5} />
          <Txt variant="title">{title}</Txt>
          <Txt color={colors.muted}>{body}</Txt>
        </View>
      ))}
      <Card style={{ backgroundColor: colors.brandSoft }}>
        <Txt variant="title">You choose each online check</Txt>
        <Txt color={colors.brand} style={{ fontSize: 13 }}>
          Online mode asks for consent before sending text. The backend sees
          that text to classify it; HTTPS protects transit in deployment. Local
          USB development uses loopback HTTP. Turning online analysis off stops
          future uploads. Resetting the online connection revokes the
          installation credential when the backend is reachable.
        </Txt>
      </Card>
      <Button
        label="Back to my settings"
        onPress={() => router.replace("/(tabs)/settings")}
      />
    </Screen>
  );
}
