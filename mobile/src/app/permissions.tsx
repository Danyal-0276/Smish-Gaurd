import { useState } from "react";
import { Linking } from "react-native";
import { router } from "expo-router";
import { Screen, BackHeader, Txt, Card, Button, Notice, SettingRow } from "../components/ui";
import { ShieldCheck } from "lucide-react-native";
import { colors } from "../theme/tokens";
import { startProtection, useSmsStore } from "../services/sms-service";
import { useAppStore } from "../store/app-store";
export default function Permissions() {
  const [cloud, setCloud] = useState(true);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const status = useSmsStore(s => s.status);
  const finish = useAppStore(s => s.finishOnboarding);
  async function enable() {
    setBusy(true); setError("");
    try { await startProtection(cloud); finish(); router.replace("/(tabs)"); }
    catch (e) { setError(e instanceof Error ? e.message : "Protection could not start."); }
    finally { setBusy(false); }
  }
  return <Screen>
    <BackHeader title="Set up SMS protection" />
    <Txt variant="heading">Your inbox.{"\n"}A clearer picture.</Txt>
    <Txt color={colors.muted}>Allow SMS access to scan real messages on this phone. Existing and incoming messages are labelled separately.</Txt>
    <Card><Txt variant="title">What you’re allowing</Txt><Txt color={colors.muted}>Read received SMS and check new arrivals. Offline rules produce immediate observations. SMS and senders are encrypted in the app’s private storage for up to 30 days, with a 5,000-message limit. We do not read contacts or SIM identifiers.</Txt></Card>
    <Card><SettingRow icon={ShieldCheck} title="Automatic model reports" value={cloud} onChange={setCloud} description="Send pending message text when connected" />
      <Txt color={colors.muted}>By starting with this enabled, you agree to automatic transmission of imported and incoming message text to our backend for model analysis when reachable. Sender numbers stay on the phone. The server does not save message bodies. Detected OTP/code messages stay local. You can pause uploads in Settings.</Txt>
    </Card>
    <Notice>Notifications show a private warning, without sender names or message text. Offline observations and model assessments can miss scams; neither proves safety.</Notice>
    {!!error && <Txt color={colors.danger} accessibilityRole="alert">{error}</Txt>}
    {status && <Txt variant="small" color={colors.muted}>SMS: {status.smsGranted ? "allowed" : "not allowed"} · Incoming: {status.receiveGranted ? "allowed" : "not allowed"} · Notifications: {status.notificationsGranted ? "allowed" : "not allowed"}</Txt>}
    <Button label="Allow SMS & start protection" loading={busy} disabled={busy} onPress={() => void enable()} />
    <Button label="Open Android app settings" tone="secondary" onPress={() => void Linking.openSettings()} />
    <Button label="Continue without SMS access" tone="secondary" onPress={() => { finish(); router.replace("/(tabs)"); }} />
  </Screen>;
}

