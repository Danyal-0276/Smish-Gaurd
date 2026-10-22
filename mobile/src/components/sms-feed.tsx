import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import type { ReactElement } from "react";
import { AppState, FlatList, View } from "react-native";
import { Txt, Card, Button } from "./ui";
import { SmsReport } from "./sms-report";
import {
  smsNative,
  useSmsStore,
  type SmsMessage,
} from "../services/sms-service";
import { colors } from "../theme/tokens";
export function SmsFeed({ thread = "", header }: { thread?: string; header?: ReactElement }) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [error, setError] = useState("");
  const busy = useSmsStore((s) => s.busy);
  const load = useCallback(async () => {
    try {
      const rows = await smsNative().messages(thread);
      setMessages(rows);
      setError("");
    } catch (e) {
      setMessages([]);
      setError(e instanceof Error ? e.message : "Could not load reports.");
    }
  }, [thread]);
  useFocusEffect(useCallback(() => {
    queueMicrotask(() => void load());
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void load();
    }, 5000);
    return () => clearInterval(timer);
  }, [load, busy]));
  return (
    <FlatList
      data={messages}
      keyExtractor={message=>message.id}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      contentContainerStyle={{paddingHorizontal:24,paddingBottom:130,gap:18}}
      ListHeaderComponent={<View style={{gap:20}}>{header}{!!error && <Txt color={colors.danger}>{error}</Txt>}</View>}
      renderItem={({item:message})=>(
        <SmsReport
          message={message}
          onDelete={() => void load()}
        />
      )}
      ListEmptyComponent={(
        <Card>
          <Txt color={colors.muted}>
            No local reports here yet. Allow SMS access and refresh your inbox
            to get started.
          </Txt>
          <Button
            label="Refresh reports"
            tone="secondary"
            onPress={() => void load()}
          />
        </Card>
      )}
      ListFooterComponent={!!messages.length ? (
        <Txt variant="small" color={colors.muted}>
          Showing up to 200 recent reports
          {thread ? " in this conversation" : ""}.
        </Txt>
      ) : null}
    />
  );
}
