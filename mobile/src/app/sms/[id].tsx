import { useLocalSearchParams } from "expo-router";
import { Screen, BackHeader, Notice } from "../../components/ui";
import { SmsFeed } from "../../components/sms-feed";
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen><BackHeader title="SMS conversation" /><Notice>Each message has its own offline findings and model report. No sender reputation is inferred.</Notice><SmsFeed thread={id} /></Screen>;
}
