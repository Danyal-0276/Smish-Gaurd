import { Tabs } from "expo-router";
import { FloatingDock } from "../../components/floating-dock";
import { useReducedMotion } from "react-native-reanimated";
import { useAppStore } from "../../store/app-store";

export default function TabLayout() {
  const reduced = useAppStore((s) => s.preferences.reduceMotion);
  const systemReduced = useReducedMotion();
  return (
    <Tabs
      tabBar={(props) => <FloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        animation: reduced || systemReduced ? "none" : "fade",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="scan" options={{ title: "Check" }} />
      <Tabs.Screen name="activity" options={{ title: "Reports" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
