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
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { sampleMessages } from "../../features/scan/demo-engine";
import { scanRepository } from "../../services/scan-repository";
import { useAppStore } from "../../store/app-store";
import { ScanProgress } from "../../components/scan-progress";

export default function Scan() {
  const [text, setText] = useState("");
  const [clipboardError, setClipboardError] = useState("");
  const addResult = useAppStore((s) => s.addResult);
  const mutation = useMutation({
    mutationFn: (value: string) => scanRepository.analyze(value),
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
        {mutation.isPending && <ScanProgress />}
        <Button
          label={
            mutation.isPending
              ? "Checking demo patterns…"
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
          Text stays in this session. History saves the result, not the message.
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
        <Pill label="SIMULATED CHECK" tone="amber" />
        <Txt variant="small" color={colors.muted}>
          Results are simulated, not a security verdict. This demo cannot read
          incoming SMS or open links.
        </Txt>
      </View>
    </Screen>
  );
}
