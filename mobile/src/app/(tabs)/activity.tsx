import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Search, Trash2, Clock3, ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import {
  Screen,
  Txt,
  RecordRow,
  IconButton,
  ConfirmSheet,
  Card,
  Button,
  Notice,
  riskDisplay,
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { useAppStore } from "../../store/app-store";
import type { Risk } from "../../types/domain";

export default function Activity() {
  const history = useAppStore((s) => s.history);
  const clear = useAppStore((s) => s.clearHistory);
  const [filter, setFilter] = useState<Risk | "all">("all");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(false);
  const filtered = history.filter(
    (r) =>
      (filter === "all" || r.risk === filter) &&
      `${riskDisplay[r.risk].short} ${r.origin === "sample" ? "sample message" : r.mode === "backend_model" ? "online model check" : "manual demo check"} ${new Date(r.createdAt).toLocaleDateString()} ${new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 5 }}>
          <Txt variant="label" color={colors.muted}>
            ON THIS DEVICE
          </Txt>
          <Txt variant="heading">Your checks.</Txt>
        </View>
        <IconButton
          icon={Trash2}
          label="Clear history"
          onPress={() => setConfirm(true)}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 17,
          paddingHorizontal: 15,
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search check metadata"
          placeholder="Search checks or dates"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            height: 50,
            fontFamily: fonts.regular,
            color: colors.ink,
            fontSize: 13,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        {(
          [
            { value: "all", title: "All checks" },
            { value: "high", title: "High risk" },
            { value: "review", title: "Review" },
            { value: "low", title: "Low risk" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item.value }}
            onPress={() => setFilter(item.value)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 13,
              borderRadius: 99,
              backgroundColor:
                filter === item.value ? colors.brand : colors.paper,
            }}
          >
            <Txt
              variant="small"
              color={filter === item.value ? colors.paper : colors.muted}
            >
              {item.title}
            </Txt>
          </Pressable>
        ))}
      </View>
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 5,
          }}
        >
          <Txt variant="label" color={colors.muted}>
            CHECK HISTORY
          </Txt>
          <Txt variant="small" color={colors.muted}>
            {filtered.length} records
          </Txt>
        </View>
        {filtered.length ? (
          filtered.map((record, i) => (
            <RecordRow
              key={record.id}
              record={record}
              last={i === filtered.length - 1}
            />
          ))
        ) : (
          <Card
            style={{ alignItems: "center", paddingVertical: 32, marginTop: 12 }}
          >
            <Clock3 size={32} color={colors.brand} strokeWidth={1.3} />
            <Txt variant="title">
              {history.length ? "Nothing matches yet." : "A fresh start."}
            </Txt>
            <Txt color={colors.muted} style={{ textAlign: "center" }}>
              {history.length
                ? "Try another filter or date."
                : "Your checks will appear here when local history is enabled."}
            </Txt>
            <Button
              label="Check a message"
              icon={ArrowUpRight}
              onPress={() => router.push("/(tabs)/scan")}
            />
          </Card>
        )}
      </View>
      <Notice>
        Only check metadata is stored. Message text is not retained after this
        session, and sample records are labelled as samples.
      </Notice>
      <ConfirmSheet
        visible={confirm}
        title="Clear this history?"
        body="This removes local check records and session results. It does not delete messages from your phone’s SMS inbox."
        confirmLabel="Clear history"
        onConfirm={clear}
        onClose={() => setConfirm(false)}
      />
    </Screen>
  );
}
