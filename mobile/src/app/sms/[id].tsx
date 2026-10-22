import { useLocalSearchParams } from "expo-router";
import { Screen, BackHeader, Notice } from "../../components/ui";
import { SmsFeed } from "../../components/sms-feed";
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen><BackHeader title="SMS conversation" /><Notice>Results apply to each message, not the sender.</Notice><SmsFeed thread={id} /></Screen>;
}
