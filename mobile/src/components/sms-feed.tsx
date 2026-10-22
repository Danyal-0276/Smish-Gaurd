import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import type { ReactElement } from "react";
import {
  AppState,
  FlatList,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { Txt, Card, Button } from "./ui";
import { SmsReport } from "./sms-report";
import {
  smsNative,
  useSmsStore,
  type SmsMessage,
} from "../services/sms-service";
import { colors } from "../theme/tokens";
import {
  filterReports,
  type ReportRiskFilter,
} from "../services/report-filters";
export function SmsFeed({
  thread = "",
  header,
  summary,
  filterable = false,
}: {
  thread?: string;
  header?: ReactElement;
  summary?: ReactElement;
  filterable?: boolean;
}) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<ReportRiskFilter>("all");
  const filtered = useMemo(
    () => (filterable ? filterReports(messages, risk, query) : messages),
    [messages, risk, query, filterable],
  );
  const hasFilters = risk !== "all" || Boolean(query.trim());
  function clearFilters() {
    setQuery("");
    setRisk("all");
  }
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
  useFocusEffect(
    useCallback(() => {
      if (!busy) queueMicrotask(() => void load());
      const timer = setInterval(() => {
        if (AppState.currentState === "active") void load();
      }, 5000);
      return () => clearInterval(timer);
    }, [load, busy]),
  );
  return (
    <FlatList
      data={filtered}
      keyExtractor={(message) => message.id}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: 130,
        gap: 18,
      }}
      ListHeaderComponent={
        <View style={{ gap: 20 }}>
          {header}
          {filterable && (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 18,
                  backgroundColor: colors.paper,
                  paddingHorizontal: 14,
                }}
              >
                <Search size={19} color={colors.muted} />
                <TextInput
                  accessibilityLabel="Search reports by sender or message"
                  placeholder="Search sender or message"
                  placeholderTextColor={colors.muted}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  style={{
                    flex: 1,
                    minHeight: 50,
                    color: colors.ink,
                    fontSize: 14,
                  }}
                />
                {!!query && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    onPress={() => setQuery("")}
                    hitSlop={8}
                    style={{
                      minHeight: 44,
                      minWidth: 36,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 8 }}
              >
                {(
                  [
                    ["all", "All"],
                    ["high", "High risk"],
                    ["review", "Review"],
                    ["low", "Low risk"],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: risk === value }}
                    onPress={() => setRisk(value)}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 16,
                      borderRadius: 24,
                      justifyContent: "center",
                      backgroundColor:
                        risk === value ? colors.brand : colors.paper,
                      borderWidth: 1,
                      borderColor: risk === value ? colors.brand : colors.line,
                    }}
                  >
                    <Txt
                      variant="small"
                      color={risk === value ? colors.paper : colors.ink}
                    >
                      {label}
                    </Txt>
                  </Pressable>
                ))}
              </ScrollView>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Txt
                  variant="small"
                  color={colors.muted}
                  accessibilityLiveRegion="polite"
                >
                  {filtered.length} of {messages.length} recent reports
                </Txt>
                {hasFilters && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear report filters"
                    onPress={clearFilters}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Txt variant="small" color={colors.brand}>
                      Reset filters
                    </Txt>
                  </Pressable>
                )}
              </View>
              <Txt variant="small" color={colors.muted}>
                Latest 200 reports. Risk uses the model result when ready,
                otherwise the offline check.
              </Txt>
            </View>
          )}
          {!hasFilters && summary}
          {!!error && <Txt color={colors.danger}>{error}</Txt>}
        </View>
      }
      renderItem={({ item: message }) => (
        <SmsReport message={message} onDelete={() => void load()} />
      )}
      ListEmptyComponent={
        <Card>
          <Txt color={colors.muted}>
            {error
              ? "Reports could not be loaded. Try refreshing."
              : messages.length
                ? "No reports match your search and risk filter."
                : "No local reports here yet. Allow SMS access and refresh your inbox to get started."}
          </Txt>
          <Button
            label={
              messages.length && hasFilters
                ? "Clear filters"
                : "Refresh reports"
            }
            tone="secondary"
            onPress={() =>
              messages.length && hasFilters ? clearFilters() : void load()
            }
          />
        </Card>
      }
      ListFooterComponent={
        !!filtered.length ? (
          <Txt variant="small" color={colors.muted}>
            Showing up to 200 recent reports
            {thread ? " in this conversation" : ""}.
          </Txt>
        ) : undefined
      }
    />
  );
}
