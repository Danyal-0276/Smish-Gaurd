import { useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Screen, Txt, Card, Button, Notice } from "../../components/ui";
import { colors } from "../../theme/tokens";
import { smsNative, refreshSms } from "../../services/sms-service";
export default function Check() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function check() {
    setBusy(true);
    setError("");
    try {
      const thread = await smsNative().manual(text);
      await refreshSms();
      setText("");
      router.push({ pathname: "/sms/[id]", params: { id: thread } });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not check this message.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Txt variant="label" color={colors.muted}>
        ANOTHER MESSAGE?
      </Txt>
      <Txt variant="heading">Paste it. Check it.</Txt>
      <Txt color={colors.muted}>
        Your inbox is checked through SMS protection. You can also paste a
        message here.
      </Txt>
      <Card>
        <TextInput
          accessibilityLabel="Message to check"
          multiline
          maxLength={5000}
          value={text}
          onChangeText={setText}
          placeholder="Paste a message…"
          placeholderTextColor={colors.muted}
          style={{
            minHeight: 180,
            color: colors.ink,
            textAlignVertical: "top",
            fontSize: 16,
          }}
        />
        <Txt variant="small" color={colors.muted}>
          {text.length} / 5,000
        </Txt>
      </Card>
      <Button
        label="Paste from clipboard"
        tone="secondary"
        onPress={() => {
          void Clipboard.getStringAsync()
            .then((value) => setText(value.slice(0, 5000)))
            .catch(() =>
              setError("Clipboard unavailable. Paste directly into the field."),
            );
        }}
      />
      <Button
        label="Check message"
        disabled={!text.trim() || busy}
        loading={busy}
        onPress={() => void check()}
      />
      {!!error && (
        <Txt color={colors.danger} accessibilityRole="alert">
          {error}
        </Txt>
      )}
      <Notice>
        Offline checks run immediately. Eligible messages get a model report
        automatically when connected and uploads are enabled.
      </Notice>
    </Screen>
  );
}
