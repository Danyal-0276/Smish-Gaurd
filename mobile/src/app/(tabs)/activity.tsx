import { Screen,Txt,Notice } from "../../components/ui";
import { SmsFeed } from "../../components/sms-feed";
import { SmsMetrics } from "../../components/sms-metrics";
import { useSmsStore } from "../../services/sms-service";
export default function Reports() {
  const status = useSmsStore(s=>s.status);
  return <Screen><Txt variant="heading">Your reports.</Txt>{status && <SmsMetrics status={status} />}<Notice>{status?.pending ?? 0} messages waiting for model reports.</Notice><SmsFeed /></Screen>;
}

