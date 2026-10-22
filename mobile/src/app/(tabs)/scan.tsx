import { useState } from "react";
import { View, TextInput, Pressable, Keyboard } from "react-native";
import {
  ClipboardPaste,
  X,
  ArrowUpRight,
  ScanLine,
  LockKeyhole,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import {
  Screen,
  Txt,
  Button,
  Pill,
  Notice,
  Card,
  Enter,
  ConfirmSheet,
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { sampleMessages } from "../../features/scan/demo-engine";
import { scanRepository } from "../../services/scan-repository";
import { useAppStore } from "../../store/app-store";
import { ScanProgress } from "../../components/scan-progress";
import { analyzeOnline } from "../../services/online-service";

export default function Scan() {
  const [text, setText] = useState("");
  const [clipboardError, setClipboardError] = useState("");
  const [consentPrompt, setConsentPrompt] = useState(false);
  const online = useAppStore((s) => s.preferences.cloudAnalysis) ?? false;
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const addResult = useAppStore((s) => s.addResult);
  const mutation = useMutation({
    mutationFn: (value: string) => online ? analyzeOnline(value, true) : scanRepository.analyze(value),
    retry: false,
    onSuccess: (result) => {
      addResult(result);
      router.push({ pathname: "/result/[id]", params: { id: result.id } });
    },
  });
  async function paste() {
    try {
      const value = await Clipboard.getStringAsync();
      setText(value.slice(0, 5000));
      setClipboardError(value ? "" : "Your clipboard is empty.");
    } catch {
      setClipboardError(
        "Clipboard access was unavailable. You can paste directly into the field.",
      );
    }
  }
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Txt variant="label" color={colors.muted}>
          BEFORE YOU CLICK
        </Txt>
        <Txt variant="heading">
          Check the text.{"\n"}
          <Txt variant="heading" color={colors.brand}>
            Take your time.
          </Txt>
        </Txt>
        <Txt color={colors.muted}>
          Paste a message to explore its warning signs.
        </Txt>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[{ label: "Demo", active: !online, action: () => updatePreferences({ cloudAnalysis: false }) }, { label: "Online model", active: online, action: () => setConsentPrompt(true) }].map((mode) => (
          <Pressable key={mode.label} accessibilityRole="radio" accessibilityState={{ checked: mode.active }} disabled={mutation.isPending} onPress={mode.action} style={{ flex: 1, paddingVertical: 13, alignItems: "center", backgroundColor: mode.active ? colors.brand : colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 99 }}>
            <Txt variant="small" color={mode.active ? colors.paper : colors.ink}>{mode.label}</Txt>
          </Pressable>
        ))}
      </View>
      <Enter>
        <Card style={{ padding: 18, gap: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Txt variant="label" color={colors.muted}>
              MESSAGE TO CHECK
            </Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear message"
              disabled={!text || mutation.isPending}
              onPress={() => {
                setText("");
                mutation.reset();
              }}
              hitSlop={10}
            >
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Message to check"
            placeholder="Paste the message here…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={5000}
            editable={!mutation.isPending}
            value={text}
            onChangeText={(value) => {
              setText(value);
              mutation.reset();
            }}
            textAlignVertical="top"
            style={{
              fontFamily: fonts.regular,
              color: colors.ink,
              fontSize: 15,
              lineHeight: 26,
              minHeight: 180,
              padding: 0,
            }}
          />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingTop: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={paste}
              disabled={mutation.isPending}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 32,
              }}
            >
              <ClipboardPaste size={16} color={colors.brand} />
              <Txt variant="small" color={colors.brand}>
                Paste message
              </Txt>
            </Pressable>
            <Txt variant="small" color={colors.muted}>
              {text.length.toLocaleString()} / 5,000
            </Txt>
          </View>
        </Card>
      </Enter>
      {(clipboardError || mutation.error) && (
        <Txt accessibilityRole="alert" color={colors.danger} variant="small">
          {clipboardError || mutation.error?.message}
        </Txt>
      )}
      <View style={{ gap: 12 }}>
        {mutation.isPending && !online && <ScanProgress />}
        <Button
          label={
            mutation.isPending
              ? online ? "Checking with the model…" : "Checking demo patterns…"
              : "Check this message"
          }
          icon={ScanLine}
          disabled={!text.trim()}
          loading={mutation.isPending}
          onPress={() => {
            Keyboard.dismiss();
            mutation.mutate(text);
          }}
        />
        <Notice icon={LockKeyhole}>
          {online ? "Your text is sent to our Django service for analysis and is not saved there. History keeps metadata only." : "Text stays in this demo session. History saves the result, not the message."}
        </Notice>
      </View>
      <View style={{ gap: 12 }}>
        <Txt variant="title">Try an example</Txt>
        <Txt variant="small" color={colors.muted}>
          Choose a sample, then tap Check.
        </Txt>
        {sampleMessages.map((sample) => (
          <Pressable
            key={sample.label}
            accessibilityRole="button"
            disabled={mutation.isPending}
            onPress={() => {
              setText(sample.text);
              mutation.reset();
            }}
            style={({ pressed }) => ({
              padding: 16,
              backgroundColor: colors.paper,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
                {sample.label}
              </Txt>
              <Txt variant="small" color={colors.muted}>
                {sample.description}
              </Txt>
            </View>
            <ArrowUpRight size={18} color={colors.brand} />
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Pill label={online ? "ONLINE MODEL · ENGLISH-ORIENTED" : "SIMULATED CHECK"} tone={online ? "neutral" : "amber"} />
        <Txt variant="small" color={colors.muted}>
          {online ? "Uses the evaluated backend model, not a safety guarantee. Unsupported text gets no verdict. No SMS inbox access or website visits." : "Results are simulated, not a security verdict. This demo cannot read incoming SMS or open links."}
        </Txt>
      </View>
      <ConfirmSheet visible={consentPrompt} title="Enable online analysis?" body="Messages you deliberately check will be sent to our Django backend, where the model processes them transiently. Text is not saved in its database. The model is evaluated on English-oriented SMS data and can miss phishing. This does not grant SMS inbox access. You can switch back to Demo at any time." confirmLabel="I agree — use online analysis" confirmTone="primary" onClose={() => setConsentPrompt(false)} onConfirm={() => { updatePreferences({ cloudAnalysis: true }); mutation.reset(); }} />
    </Screen>
  );
}
