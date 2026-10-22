import { router } from "expo-router";
import { Screen, Txt, Button, Card } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Card>
        <Txt variant="heading">A little off track.</Txt>
        <Txt>This page isn’t here. Let’s get you back home.</Txt>
        <Button label="Back home" onPress={() => router.replace("/(tabs)")} />
      </Card>
    </Screen>
  );
}
