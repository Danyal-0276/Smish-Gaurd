import { Screen,Txt,Notice } from "../../components/ui";
import { SmsFeed } from "../../components/sms-feed";
export default function Reports() {
  return <Screen><Txt variant="heading">Your reports.</Txt><Notice>Offline observations are available immediately. Model reports appear here automatically after queued checks complete.</Notice><SmsFeed /></Screen>;
}

