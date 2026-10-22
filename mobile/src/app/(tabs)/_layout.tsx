import { Tabs } from "expo-router";
import { View, Platform } from "react-native";
import {
  House,
  ScanLine,
  Clock3,
  BookOpen,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../../theme/tokens";

const tabs: { name: string; title: string; Icon: LucideIcon }[] = [
  { name: "index", title: "Home", Icon: House },
  { name: "scan", title: "Check", Icon: ScanLine },
  { name: "activity", title: "Activity", Icon: Clock3 },
  { name: "learn", title: "Learn", Icon: BookOpen },
  { name: "settings", title: "Settings", Icon: SlidersHorizontal },
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          height: 76 + (Platform.OS === "web" ? 0 : insets.bottom),
          paddingTop: 10,
          paddingBottom: Math.max(
            Platform.OS === "web" ? 12 : insets.bottom,
            12,
          ),
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 10,
          marginTop: 3,
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
      }}
    >
      {tabs.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  width: 46,
                  height: 30,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? colors.sage : "transparent",
                }}
              >
                <Icon size={20} color={color} strokeWidth={focused ? 2 : 1.6} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
