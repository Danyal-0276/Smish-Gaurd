import { useLocalSearchParams } from "expo-router";
import { Screen, BackHeader, Notice } from "../../components/ui";
import { SmsFeed } from "../../components/sms-feed";
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen
      scroll={false}
      style={{ flex: 1, paddingHorizontal: 0, paddingBottom: 0 }}
    >
      <SmsFeed
        thread={id}
        header={
          <>
            <BackHeader title="SMS conversation" />
            <Notice>Results apply to each message, not the sender.</Notice>
          </>
        }
      />
    </Screen>
  );
}
