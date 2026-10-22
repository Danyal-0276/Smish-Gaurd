import { View } from "react-native";
import {
  ScanLine,
  MessageSquare,
  Bell,
  CircleCheck,
  ArrowRight,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  Screen,
  Txt,
  BackHeader,
  Card,
  Pill,
  Button,
  Notice,
} from "../components/ui";
import { colors } from "../theme/tokens";
export default function Permissions() {
  return (
    <Screen>
      <BackHeader title="Protection setup" />
      <Txt variant="heading">Know what’s{"\n"}looking out for you.</Txt>
      <Txt color={colors.muted}>
        An honest look at what’s available right now.
      </Txt>
      {[
        {
          Icon: ScanLine,
          title: "Manual demo checks",
          body: "Paste a message and explore a simulated result.",
          ready: true,
        },
        {
          Icon: MessageSquare,
          title: "Incoming SMS screening",
          body: "Not connected yet. This build cannot read, monitor, or quarantine your messages.",
          ready: false,
        },
        {
          Icon: Bell,
          title: "Live warning notifications",
          body: "Not connected yet. No notification permission is requested by this demo.",
          ready: false,
        },
      ].map(({ Icon, title, body, ready }) => (
        <Card key={title}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Icon size={24} color={colors.forest} strokeWidth={1.5} />
            <Pill
              label={ready ? "AVAILABLE" : "NOT CONNECTED"}
              tone={ready ? "green" : "neutral"}
            />
          </View>
          <Txt variant="title">{title}</Txt>
          <Txt color={colors.muted} style={{ fontSize: 13 }}>
            {body}
          </Txt>
        </Card>
      ))}
      <Notice icon={CircleCheck}>
        You can use manual checks without giving access to your inbox. Future
        permissions will be requested only when their feature is available.
      </Notice>
      <Button
        label="Explore a manual check"
        icon={ArrowRight}
        onPress={() => router.push("/(tabs)/scan")}
      />
    </Screen>
  );
}
