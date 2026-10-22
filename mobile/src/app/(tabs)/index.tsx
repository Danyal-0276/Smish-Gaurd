import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { BrandMark } from "../../components/brand";
import {
  Screen,
  Txt,
  Pill,
  Card,
  Button,
  Enter,
  Notice,
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { refreshSms, useSmsStore } from "../../services/sms-service";
export default function Home() {
  const { status, threads, busy, error } = useSmsStore();
  return (
    <Screen style={{ gap: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <BrandMark size={32} />
        <Txt variant="title">smishguard</Txt>
      </View>
      <Enter>
        <Pill label="YOUR SMS · ON THIS PHONE" />
        <Txt variant="display">
          Stay ahead of{"\n"}
          <Txt variant="display" color={colors.brand}>
            the next text.
          </Txt>
        </Txt>
      </Enter>
      <Card style={{ backgroundColor: colors.brand }}>
        <Txt variant="title" color={colors.paper}>
          {status?.enabled && status.smsGranted
            ? "SMS protection enabled"
            : "Set up your protection"}
        </Txt>
        <Txt color={colors.paper}>
          {status?.enabled
            ? status.connection
            : "Allow SMS access to check the messages on this phone."}
        </Txt>
        <Button
          label={
            status?.enabled && status.smsGranted
              ? "Refresh inbox"
              : "Set up SMS access"
          }
          tone="secondary"
          loading={busy}
          disabled={busy}
          onPress={() =>
            status?.enabled && status.smsGranted
              ? void refreshSms(true)
              : router.push("/permissions")
          }
        />
      </Card>
      {!!error && <Notice>{error}</Notice>}
      {status && (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {[
            [status.total, "Messages"],
            [status.pending, "Queued"],
            [status.completed, "Model reports"],
          ].map(([count, label]) => (
            <View key={label} style={{ gap: 4 }}>
              <Txt variant="heading">{count}</Txt>
              <Txt variant="small" color={colors.muted}>
                {label}
              </Txt>
            </View>
          ))}
        </View>
      )}
      <View style={{ gap: 6 }}>
        <Txt variant="title">Conversations</Txt>
        <Txt variant="small" color={colors.muted}>
          Newest 200 messages are imported first. Load older messages below.
          Reports are per message, not a judgement about a sender.
        </Txt>
      </View>
      {threads.map((thread, index) => (
        <Enter key={thread.id} delay={Math.min(index * 25, 150)}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/sms/[id]", params: { id: thread.id } })
            }
          >
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Txt style={{ fontFamily: fonts.bold, flex: 1 }}>
                  {thread.sender}
                </Txt>
                <Txt variant="small" color={colors.muted}>
                  {new Date(thread.received).toLocaleDateString()}
                </Txt>
              </View>
              <Txt variant="small" color={colors.muted}>
                {thread.count} messages · {thread.pending} waiting for model
              </Txt>
            </Card>
          </Pressable>
        </Enter>
      ))}
      {!threads.length && (
        <Card>
          <Txt color={colors.muted}>
            Your real SMS conversations will appear here after access is
            granted.
          </Txt>
        </Card>
      )}
      {status?.enabled && status.hasOlder && (
        <Button
          label="Load 200 older messages"
          tone="secondary"
          loading={busy}
          disabled={busy}
          onPress={() => void refreshSms(true, true)}
        />
      )}
      <Notice>
        Offline checks use local rules. Model reports update automatically when
        the backend is reachable. Messages containing detected OTP/code wording
        remain local.
      </Notice>
    </Screen>
  );
}
