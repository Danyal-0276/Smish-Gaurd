import { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import {
  House,
  ScanLine,
  Clock3,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, fonts } from "../theme/tokens";
import { useAppStore } from "../store/app-store";
import { Txt } from "./ui";

const icons = {
  index: House,
  scan: ScanLine,
  activity: Clock3,
  learn: BookOpen,
  settings: SlidersHorizontal,
};

/** A single moving capsule keeps navigation readable without five competing accents. */
export function FloatingDock({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const preferences = useAppStore((s) => s.preferences);
  const systemReduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const position = useSharedValue(0);
  const itemWidth = Math.max(0, (width - 14) / state.routes.length);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    const next = state.index * itemWidth;
    position.value =
      preferences.reduceMotion || systemReduced
        ? next
        : withTiming(next, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [
    state.index,
    itemWidth,
    preferences.reduceMotion,
    systemReduced,
    position,
  ]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));
  if (keyboardOpen) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.placement, { bottom: Math.max(insets.bottom, 14) }]}
    >
      <View
        style={styles.dock}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.selection, { width: itemWidth }, animated]}
          />
        )}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const Icon = icons[route.name as keyof typeof icons] ?? House;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={
                options.tabBarAccessibilityLabel ?? options.title ?? route.name
              }
              onPress={() => {
                const event = emitter.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  if (preferences.haptics)
                    void Haptics.selectionAsync().catch(() => {});
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() =>
                emitter.emit({ type: "tabLongPress", target: route.key })
              }
              style={({ pressed }) => [
                styles.item,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Icon
                size={21}
                color={focused ? colors.paper : colors.dockMuted}
                strokeWidth={focused ? 2 : 1.7}
              />
              <Txt
                style={[
                  styles.label,
                  { color: focused ? colors.paper : colors.dockMuted },
                ]}
              >
                {options.title ?? route.name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  placement: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  dock: {
    width: "100%",
    maxWidth: 490,
    flexDirection: "row",
    padding: 6,
    borderRadius: 36,
    backgroundColor: colors.night,
    borderWidth: 1,
    borderColor: "#30323B",
    shadowColor: "#001A52",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 12,
  },
  selection: {
    position: "absolute",
    left: 7,
    top: 7,
    bottom: 7,
    borderRadius: 28,
    backgroundColor: colors.brand,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 28,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0,
  },
});
