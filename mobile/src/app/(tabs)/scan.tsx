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
          A MOMENT BEFORE THE NEXT STEP
        </Txt>
        <Txt variant="heading">Let’s look at{"\n"}that message.</Txt>
        <Txt color={colors.muted}>
          Paste an unexpected text. We’ll walk through the signs together.
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
            placeholderTextColor="#99A49A"
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
              <ClipboardPaste size={16} color={colors.forest} />
              <Txt variant="small" color={colors.forest}>
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
        <Button
          label={
            mutation.isPending
              ? "Looking at the patterns…"
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
          Your text stays in this demo session. Only result metadata is saved
          when history is on.
        </Notice>
      </View>
      <View style={{ gap: 12 }}>
        <Txt variant="title">Just exploring?</Txt>
        <Txt variant="small" color={colors.muted}>
          Try a sample and see how the experience works.
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
            <ArrowUpRight size={18} color={colors.forest} />
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Pill label="SIMULATED CHECK" tone="amber" />
        <Txt variant="small" color={colors.muted}>
          These results use simple demo patterns, not the trained model. No live
          SMS permissions, network requests, or website visits are involved.
        </Txt>
      </View>
    </Screen>
  );
}
