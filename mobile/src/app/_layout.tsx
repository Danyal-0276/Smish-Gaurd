import { useEffect, useState } from "react";
import { View, StyleSheet, Platform, AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  ReduceMotion,
  useReducedMotion,
} from "react-native-reanimated";
import { BrandMark } from "../components/brand";
import { Txt } from "../components/ui";
import { colors } from "../theme/tokens";
import { useAppStore } from "../store/app-store";

import { refreshSms } from "../services/sms-service";

void SplashScreen.preventAutoHideAsync().catch(() => {});
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function RootLayout() {
  const [fontsReady, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  useEffect(() => {
    if (!hydrated) return;
    void refreshSms(true);
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshSms(true);
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refreshSms();
    }, 5000);
    return () => {
      foreground.remove();
      clearInterval(timer);
    };
  }, [hydrated]);
  const [introDone, setIntroDone] = useState(false);
  const ready = (fontsReady || Boolean(fontError)) && hydrated;
  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(
      () => setIntroDone(true),
      reduced || systemReduced ? 100 : 1200,
    );
    return () => clearTimeout(timer);
  }, [ready, reduced, systemReduced]);
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        backgroundColor: Platform.OS === "web" ? "#EDF0F6" : colors.background,
      }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 540,
              alignSelf: "center",
              backgroundColor: colors.background,
            }}
          >
            <StatusBar style="dark" />
            {ready && (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation:
                    reduced || systemReduced ? "none" : "fade_from_bottom",
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="result/[id]" />
                <Stack.Screen name="lesson/[id]" />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="permissions" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="sms/[id]" />
              </Stack>
            )}
            {!introDone && (
              <Animated.View
                exiting={FadeOut.duration(280).reduceMotion(
                  reduced ? ReduceMotion.Always : ReduceMotion.System,
                )}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: colors.background,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    zIndex: 10,
                  },
                ]}
              >
                <Animated.View
                  entering={FadeInUp.duration(500).reduceMotion(
                    reduced ? ReduceMotion.Always : ReduceMotion.System,
                  )}
                >
                  <BrandMark size={86} />
                </Animated.View>
                <Animated.View
                  entering={FadeIn.delay(200)
                    .duration(550)
                    .reduceMotion(
                      reduced ? ReduceMotion.Always : ReduceMotion.System,
                    )}
                  style={{ alignItems: "center", gap: 7 }}
                >
                  <Txt variant="heading">smishguard</Txt>
                  <Txt variant="small" color={colors.muted}>
                    A clearer next step.
                  </Txt>
                </Animated.View>
                <View style={{ position: "absolute", bottom: 56 }}>
                  <Txt variant="label" color={colors.muted}>
                    PAUSE. CHECK. DECIDE.
                  </Txt>
                </View>
              </Animated.View>
            )}
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
