import type { PropsWithChildren } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Switch,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";
import { router, useSegments } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";
import { colors, fonts } from "../theme/tokens";
import { useAppStore } from "../store/app-store";
import type { Risk, ScanRecord } from "../types/domain";

type Variant = "body" | "small" | "label" | "title" | "heading" | "display";
const textStyles = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 23 },
  small: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 19 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.3,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -1,
  },
  display: {
    fontFamily: fonts.extra,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1.6,
  },
});
export function Txt({
  variant = "body",
  color = colors.ink,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...props} style={[{ color }, textStyles[variant], style]} />;
}
export function Screen({
  children,
  style,
  scroll = true,
}: PropsWithChildren<{ style?: ViewStyle; scroll?: boolean }>) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const dockSpace = segments.some((segment) => segment === "(tabs)")
    ? 100 + insets.bottom
    : 18;
  const content = (
    <View
      style={[
        { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, gap: 24 },
        style,
      ]}
    >
      {children}
    </View>
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: dockSpace }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
export function Enter({
  children,
  delay = 0,
}: PropsWithChildren<{ delay?: number }>) {
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  return (
    <Animated.View
      entering={
        reduced || systemReduced
          ? undefined
          : FadeInUp.duration(380)
              .delay(delay)
              .reduceMotion(ReduceMotion.System)
      }
    >
      {children}
    </Animated.View>
  );
}
export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.paper,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 20,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.between}>
      <Txt variant="title">{title}</Txt>
      {action && (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={12}>
          <Txt variant="small" color={colors.brand}>
            {action}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}
export function Button({
  label,
  onPress,
  tone = "primary",
  icon: Icon = ArrowUpRight,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
}) {
  const haptics = useAppStore((s) => s.preferences.haptics);
  const foreground =
    tone === "primary"
      ? colors.paper
      : tone === "danger"
        ? colors.danger
        : colors.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={() => {
        if (haptics) void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: 56,
          borderRadius: 999,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backgroundColor:
            tone === "primary"
              ? colors.brand
              : tone === "danger"
                ? colors.dangerSoft
                : colors.brandSoft,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Txt style={{ fontFamily: fonts.bold }} color={foreground}>
        {label}
      </Txt>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <Icon size={19} color={foreground} strokeWidth={1.8} />
      )}
    </Pressable>
  );
}
export function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.paper,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon size={21} strokeWidth={1.7} color={colors.ink} />
    </Pressable>
  );
}
export function BackHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.between}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconButton
          icon={ArrowLeft}
          label="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)")
          }
        />
        <Txt variant="title">{title}</Txt>
      </View>
      {right}
    </View>
  );
}
export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "danger";
}) {
  const pair =
    tone === "green"
      ? [colors.greenSoft, colors.green]
      : tone === "amber"
        ? [colors.amberSoft, colors.amber]
        : tone === "danger"
          ? [colors.dangerSoft, colors.danger]
          : [colors.brandSoft, colors.brand];
  return (
    <View
      style={{
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 99,
        backgroundColor: pair[0],
        alignSelf: "flex-start",
      }}
    >
      <Txt
        variant="small"
        color={pair[1]}
        style={{ fontSize: 10, fontFamily: fonts.bold }}
      >
        {label}
      </Txt>
    </View>
  );
}
export const riskDisplay: Record<
  Risk,
  { title: string; short: string; color: string; bg: string; icon: LucideIcon }
> = {
  low: {
    title: "Low detected risk",
    short: "Low risk",
    color: colors.green,
    bg: colors.greenSoft,
    icon: CircleCheck,
  },
  review: {
    title: "Worth a closer look",
    short: "Review",
    color: colors.amber,
    bg: colors.amberSoft,
    icon: CircleHelp,
  },
  high: {
    title: "Pause before you act",
    short: "High risk",
    color: colors.danger,
    bg: colors.dangerSoft,
    icon: TriangleAlert,
  },
};
export function RecordRow({
  record,
  last = false,
}: {
  record: ScanRecord;
  last?: boolean;
}) {
  const risk = riskDisplay[record.risk];
  const Icon = risk.icon;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/result/[id]", params: { id: record.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${risk.short}, ${record.origin === "sample" ? "sample message" : "manual demo check"}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          backgroundColor: risk.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} color={risk.color} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>
          {record.origin === "sample" ? "Sample message" : "Manual demo check"}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {record.characterCount} characters ·{" "}
          {new Date(record.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Txt>
      </View>
      <Txt variant="small" color={risk.color} style={{ fontSize: 10 }}>
        {risk.short}
      </Txt>
      <ChevronRight size={15} color={colors.muted} />
    </Pressable>
  );
}
export function Notice({
  children,
  icon: Icon = CircleHelp,
}: PropsWithChildren<{ icon?: LucideIcon }>) {
  return (
    <View style={{ flexDirection: "row", gap: 9, alignItems: "flex-start" }}>
      <Icon size={16} color={colors.muted} style={{ marginTop: 2 }} />
      <Txt variant="small" color={colors.muted} style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}
export function SettingRow({
  title,
  description,
  icon: Icon,
  value,
  onChange,
  onPress,
  danger = false,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  value?: boolean;
  onChange?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <>
      <View
        style={{
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: danger ? colors.dangerSoft : colors.brandSoft,
        }}
      >
        <Icon
          size={17}
          color={danger ? colors.danger : colors.brand}
          strokeWidth={1.7}
        />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt
          style={{ fontSize: 13, fontFamily: fonts.bold }}
          color={danger ? colors.danger : colors.ink}
        >
          {title}
        </Txt>
        {description && (
          <Txt variant="small" color={colors.muted}>
            {description}
          </Txt>
        )}
      </View>
      {onChange ? (
        <Switch
          accessibilityLabel={title}
          value={value}
          onValueChange={onChange}
          trackColor={{ false: colors.line, true: colors.brand }}
          thumbColor={colors.paper}
        />
      ) : (
        <ChevronRight size={17} color={colors.muted} />
      )}
    </>
  );
  return onChange ? (
    <View style={styles.settingRow}>{inner}</View>
  ) : (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.settingRow}
    >
      {inner}
    </Pressable>
  );
}
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  confirmTone = "danger",
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmTone?: "primary" | "danger";
}) {
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  return (
    <Modal
      transparent
      visible={visible}
      animationType={reduced || systemReduced ? "none" : "fade"}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,14,25,.42)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close dialog"
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: colors.background,
            padding: 28,
            paddingBottom: 42,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            gap: 16,
            width: "100%",
            maxWidth: 540,
            alignSelf: "center",
          }}
        >
          <Txt variant="heading">{title}</Txt>
          <Txt color={colors.muted}>{body}</Txt>
          <Button
            label={confirmLabel}
            tone={confirmTone}
            onPress={() => {
              onConfirm();
              onClose();
            }}
          />
          <Button label="Keep it" tone="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
});
