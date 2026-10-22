import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../theme/tokens";
import { useAppStore } from "../store/app-store";

/** Decorative progress for the explicitly simulated check; no invented percentage. */
export function ScanProgress() {
  const progress = useSharedValue(0);
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  useEffect(() => {
    progress.value =
      reduced || systemReduced
        ? 0.75
        : withTiming(0.9, { duration: 1200, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [progress, reduced, systemReduced]);
  const animated = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: 3,
        borderRadius: 9,
        overflow: "hidden",
        backgroundColor: colors.brandSoft,
      }}
    >
      <Animated.View
        style={[
          { height: 3, backgroundColor: colors.brand, borderRadius: 9 },
          animated,
        ]}
      />
    </View>
  );
}
