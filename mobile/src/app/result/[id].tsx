import { useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Trash2,
  Check,
  Flag,
  ArrowRight,
  Link2,
  ShieldCheck,
  MessageSquareText,
} from "lucide-react-native";
import {
  Screen,
  Txt,
  BackHeader,
  Pill,
  Card,
  Button,
  Notice,
  ConfirmSheet,
  IconButton,
  riskDisplay,
  Enter,
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useAppStore((s) => s.results[id]);
  const record = useAppStore((s) => s.history.find((r) => r.id === id));
  const corrected = useAppStore((s) => s.corrections[id]);
  const correct = useAppStore((s) => s.correct);
  const remove = useAppStore((s) => s.deleteRecord);
  const [confirm, setConfirm] = useState(false);
  const item = result ?? record;
  if (!item)
    return (
      <Screen>
        <BackHeader title="Check details" />
        <Card>
          <Txt variant="heading">This check is gone.</Txt>
          <Txt color={colors.muted}>
            It may have been cleared from this device.
          </Txt>
          <Button
            label="Check another message"
            onPress={() => router.replace("/(tabs)/scan")}
          />
        </Card>
      </Screen>
    );
  const display = riskDisplay[item.risk];
  const online = item.mode === "backend_model";
  const Icon = display.icon;
  return (
    <Screen>
      <BackHeader
        title="A clearer picture"
        right={
          <IconButton
            icon={Trash2}
            label="Delete this check"
            onPress={() => setConfirm(true)}
          />
        }
      />
      <Enter>
        <View
          style={{
            backgroundColor: display.bg,
            borderRadius: 28,
            padding: 26,
            alignItems: "center",
            gap: 13,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 23,
              backgroundColor: colors.paper,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={31} strokeWidth={1.5} color={display.color} />
          </View>
          <Pill
            label={`${display.short.toUpperCase()} · ${online ? "MODEL RESULT" : "DEMO RESULT"}`}
            tone={
              item.risk === "high"
                ? "danger"
                : item.risk === "review"
                  ? "amber"
                  : "green"
            }
          />
          <Txt variant="heading" style={{ textAlign: "center", fontSize: 26 }}>
            {display.title}
          </Txt>
          <Txt
            color={colors.muted}
            style={{ textAlign: "center", fontSize: 13 }}
          >
            {online ? "A model assessment, not proof of safety or sender identity. Verify unexpected requests through a trusted channel." : item.risk === "low"
              ? "No configured demo patterns were found. This is not a guarantee of safety."
              : "Some demo patterns deserve your attention. Take a moment to verify the request."}
          </Txt>
        </View>
      </Enter>
      {result ? (
        <>
          <Card>
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <MessageSquareText size={16} color={colors.muted} />
              <Txt variant="label" color={colors.muted}>
                THE MESSAGE
              </Txt>
            </View>
            <Txt selectable style={{ lineHeight: 25 }}>
              {result.text}
            </Txt>
            <Txt variant="small" color={colors.muted}>
              Session only · {result.characterCount} characters
            </Txt>
          </Card>
          {!!result.indicators.length && (
            <View style={{ gap: 18 }}>
              <Txt variant="title">What caught our attention</Txt>
              {result.indicators.map((indicator, i) => (
                <View
                  key={indicator.title}
                  style={{ flexDirection: "row", gap: 13 }}
                >
                  <View
                    style={{
                      width: 27,
                      height: 27,
                      borderRadius: 10,
                      backgroundColor: colors.brandSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Txt variant="small" color={colors.brand}>
                      {String(i + 1).padStart(2, "0")}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
                      {indicator.title}
                    </Txt>
                    <Txt variant="small" color={colors.muted}>
                      {indicator.description}
                    </Txt>
                  </View>
                </View>
              ))}
            </View>
          )}
          {!!result.domains.length && (
            <Card>
              <Txt variant="label" color={colors.muted}>
                DETECTED DESTINATIONS
              </Txt>
              {result.domains.map((domain) => (
                <View
                  key={domain}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Link2 size={16} color={colors.muted} />
                  <Txt selectable style={{ flex: 1, fontSize: 12 }}>
                    {domain}
                  </Txt>
                </View>
              ))}
              <Txt variant="small" color={colors.muted}>
                Shown as text only. No website was visited or verified.
              </Txt>
            </Card>
          )}
          <View
            style={{
              backgroundColor: colors.brandSoft,
              padding: 22,
              borderRadius: 24,
              gap: 10,
            }}
          >
            <ShieldCheck size={22} color={colors.brand} />
            <Txt variant="title">Your next step</Txt>
            <Txt color={colors.brand} style={{ fontSize: 13 }}>
              {result.advice}
            </Txt>
          </View>
        </>
      ) : (
        <Card>
          <Txt variant="title">Message text wasn’t saved.</Txt>
          <Txt color={colors.muted}>
            We kept this result’s metadata, but not the message text. Paste it
            again if you want to review the details.
          </Txt>
          <Button
            tone="secondary"
            label="Enter the message again"
            onPress={() => router.push("/(tabs)/scan")}
          />
        </Card>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={corrected}
        onPress={() => correct(id)}
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          paddingVertical: 8,
        }}
      >
        {corrected ? (
          <Check size={18} color={colors.green} />
        ) : (
          <Flag size={18} color={colors.muted} />
        )}
        <Txt variant="small" color={corrected ? colors.green : colors.muted}>
          {corrected
            ? "Correction noted on this device"
            : "Does this result seem wrong?"}
        </Txt>
      </Pressable>
      <Button
        label="Check another message"
        icon={ArrowRight}
        onPress={() => router.replace("/(tabs)/scan")}
      />
      <Notice>
        {online ? `Model: ${item.modelVersion ?? "version unavailable"}. English-oriented benchmark; mistakes are possible. Text was processed transiently by the backend. Corrections stay local.` : "Simulated result, not a trained-model prediction. Your correction stays local and is not used to retrain a model."}
      </Notice>
      <ConfirmSheet
        visible={confirm}
        title="Delete this check?"
        body="Remove this result and its saved metadata from SmishGuard on this device."
        confirmLabel="Delete check"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          remove(id);
          router.replace("/(tabs)/activity");
        }}
      />
    </Screen>
  );
}
