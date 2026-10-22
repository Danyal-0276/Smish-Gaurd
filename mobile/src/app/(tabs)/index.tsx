import {
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  ArrowUpRight,
  RefreshCw,
  UserRound,
  MessageSquareText,
} from "lucide-react-native";
import { router } from "expo-router";
import { BrandMark } from "../../components/brand";
import { Screen, Txt, Card, Button, Enter, Notice } from "../../components/ui";
import { HomeMetrics } from "../../components/home-metrics";
import { HomeActivity } from "../../components/home-activity";
import { RecentConversation } from "../../components/recent-conversation";
import { colors, fonts } from "../../theme/tokens";
import { refreshSms, useSmsStore } from "../../services/sms-service";

export default function Home() {
  const { status, threads, busy, error } = useSmsStore();
  const enabled = Boolean(status?.enabled && status.smsGranted);
  return (
    <Screen
      scroll={false}
      style={{ flex: 1, paddingHorizontal: 0, paddingBottom: 0 }}
    >
      <FlatList
        data={threads}
        keyExtractor={(thread) => thread.id}
        renderItem={({ item, index }) => (
          <RecentConversation thread={item} index={index} />
        )}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        refreshing={busy}
        onRefresh={() => void refreshSms(true)}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 130,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 24, paddingBottom: 4 }}>
            <View style={styles.header}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
              >
                <BrandMark size={31} />
                <View>
                  <Txt
                    style={{
                      fontFamily: fonts.extra,
                      fontSize: 20,
                      letterSpacing: -0.8,
                    }}
                  >
                    smishguard
                  </Txt>
                  <Txt
                    variant="label"
                    color={colors.muted}
                    style={{ fontSize: 8, letterSpacing: 1.4 }}
                  >
                    YOUR SMS OVERVIEW
                  </Txt>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh SMS inbox"
                  disabled={busy}
                  onPress={() =>
                    enabled
                      ? void refreshSms(true)
                      : router.push("/permissions")
                  }
                  style={styles.headerButton}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.brand} size="small" />
                  ) : (
                    <RefreshCw size={18} color={colors.ink} />
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open my profile"
                  onPress={() => router.push("/profile")}
                  style={[
                    styles.headerButton,
                    {
                      backgroundColor: colors.night,
                      borderColor: colors.night,
                    },
                  ]}
                >
                  <UserRound size={19} color={colors.paper} />
                </Pressable>
              </View>
            </View>
            <Enter>
              <View style={styles.hero}>
                <View pointerEvents="none" style={styles.watermark}>
                  <BrandMark size={155} color={colors.paper} />
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.paper,
                    }}
                  />
                  <Txt variant="label" color={colors.paper}>
                    {enabled ? "SMS ACCESS ON" : "START WITH SMS ACCESS"}
                  </Txt>
                </View>
                <Txt color={colors.paper} style={styles.headline}>
                  Your inbox.{"\n"}In perspective.
                </Txt>
                <Txt
                  color={colors.onDark}
                  style={{ fontSize: 12, lineHeight: 19, maxWidth: 250 }}
                >
                  {enabled
                    ? status?.connection
                    : "Real messages. Clearer next steps."}
                </Txt>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    enabled ? "Check another message" : "Set up SMS protection"
                  }
                  onPress={() =>
                    router.push(enabled ? "/(tabs)/scan" : "/permissions")
                  }
                  style={({ pressed }) => [
                    styles.heroAction,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                    {enabled ? "Check a message" : "Enable SMS access"}
                  </Txt>
                  <ArrowUpRight size={18} color={colors.ink} />
                </Pressable>
              </View>
            </Enter>
            {!!error && <Notice>{error}</Notice>}
            <HomeMetrics status={status} />
            <Enter delay={100}>
              <HomeActivity status={status} />
            </Enter>
            <View style={{ gap: 5 }}>
              <View style={styles.header}>
                <Txt variant="title">Recent conversations</Txt>
                <View
                  style={{
                    backgroundColor: colors.brandSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Txt variant="small" color={colors.brand}>
                    {threads.length}
                  </Txt>
                </View>
              </View>
              <Txt variant="small" color={colors.muted}>
                Open a sender to explore their messages.
              </Txt>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Card style={{ alignItems: "center", paddingVertical: 30, gap: 12 }}>
            <View
              style={{
                backgroundColor: colors.brandSoft,
                borderRadius: 20,
                padding: 16,
              }}
            >
              <MessageSquareText color={colors.brand} size={28} />
            </View>
            <Txt variant="title">Your inbox starts here.</Txt>
            <Txt
              color={colors.muted}
              style={{ textAlign: "center", fontSize: 13 }}
            >
              {enabled
                ? "Pull down to refresh your received SMS."
                : "Allow SMS access to see your conversations."}
            </Txt>
            {!enabled && (
              <Button
                label="Set up protection"
                onPress={() => router.push("/permissions")}
              />
            )}
          </Card>
        }
        ListFooterComponent={
          <View style={{ gap: 18, paddingTop: 8 }}>
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
              Offline rules and model assessments can miss scams. Verify
              unexpected requests.
            </Notice>
          </View>
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerButton: {
    height: 42,
    width: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: colors.brand,
    borderRadius: 28,
    padding: 24,
    gap: 15,
    overflow: "hidden",
  },
  headline: {
    fontFamily: fonts.extra,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.3,
  },
  watermark: {
    position: "absolute",
    right: -45,
    bottom: 18,
    opacity: 0.1,
    transform: [{ rotate: "-12deg" }],
  },
  heroAction: {
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingHorizontal: 17,
    minHeight: 45,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 2,
  },
});
