import { useState } from "react";
import { router } from "expo-router";
import {
  Fingerprint,
  ShieldCheck,
  Activity,
  Trash2,
  UserRound,
} from "lucide-react-native";
import {
  Screen,
  Txt,
  Card,
  Button,
  SettingRow,
  ConfirmSheet,
  Notice,
} from "../../components/ui";
import { colors } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";
import { smsNative, refreshSms, useSmsStore } from "../../services/sms-service";
export default function Settings() {
  const prefs = useAppStore((s) => s.preferences);
  const update = useAppStore((s) => s.updatePreferences);
  const status = useSmsStore((s) => s.status);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  async function action(fn: () => Promise<unknown>) {
    try {
      await fn();
      await refreshSms();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update protection.");
    }
  }
  return (
    <Screen>
      <Txt variant="heading">Your controls.</Txt>
      <Card>
        <SettingRow
          icon={UserRound}
          title="My profile"
          description="Optional name & phone number"
          onPress={() => router.push("/profile")}
        />
        <Txt variant="title">SMS protection</Txt>
        <Txt color={colors.muted}>
          {status?.connection ?? "Complete protection setup to begin."}
        </Txt>
        <Button
          label="Permissions & automatic reports"
          onPress={() => router.push("/permissions")}
        />
        {status?.cloud && (
          <Button
            label="Pause automatic uploads"
            tone="secondary"
            onPress={() => void action(() => smsNative().pauseUploads())}
          />
        )}
        {status?.enabled && (
          <Button
            label="Stop SMS protection"
            tone="secondary"
            onPress={() => void action(() => smsNative().stop())}
          />
        )}
      </Card>
      <Card>
        <SettingRow
          icon={Activity}
          title="Reduce motion"
          value={prefs.reduceMotion}
          onChange={(v) => update({ reduceMotion: v })}
        />
        <SettingRow
          icon={ShieldCheck}
          title="Protection permissions"
          onPress={() => router.push("/permissions")}
        />
        <SettingRow
          icon={Fingerprint}
          title="Privacy & data retention"
          onPress={() => router.push("/privacy")}
        />
        <SettingRow
          icon={Trash2}
          title="Delete all local reports"
          description="Original SMS messages are unaffected"
          danger
          onPress={() => setConfirm(true)}
        />
      </Card>
      {!!error && <Txt color={colors.danger}>{error}</Txt>}
      <Notice>
        Pending message copies and sender names are encrypted on this phone.
        Local reports expire after 30 days. Pausing uploads cannot recall a
        request already sent.
      </Notice>
      <ConfirmSheet
        visible={confirm}
        title="Delete all local reports?"
        body="Remove all app message copies, pending requests and reports. Your original SMS stays in its messaging app. Previously imported SMS are suppressed from reimport for 30 days."
        confirmLabel="Delete local data"
        onClose={() => setConfirm(false)}
        onConfirm={() => void action(() => smsNative().clear())}
      />
    </Screen>
  );
}
