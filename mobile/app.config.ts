import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "SmishGuard",
  slug: "smishguard",
  version: "0.2.0",
  scheme: "smishguard",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/brand/icon.png",
  android: {
    package: "com.smishguard.app",
    allowBackup: false,
    permissions: ["android.permission.READ_SMS", "android.permission.RECEIVE_SMS", "android.permission.POST_NOTIFICATIONS"],
    adaptiveIcon: {
      foregroundImage: "./assets/brand/adaptive-foreground.png",
      backgroundColor: "#0064EF",
      monochromeImage: "./assets/brand/monochrome.png",
    },
    blockedPermissions: [
      "android.permission.READ_PHONE_STATE",
      "android.permission.READ_CONTACTS",
    ],
  },
  ios: { supportsTablet: true, bundleIdentifier: "com.smishguard.app" },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/brand/favicon.png",
    name: "SmishGuard",
  },
  plugins: [
    "expo-secure-store",
    "./plugins/with-short-cmake-paths",
    "expo-router",
    "expo-font",
    "expo-sqlite",
    [
      "expo-splash-screen",
      {
        image: "./assets/brand/splash-mark.png",
        imageWidth: 100,
        resizeMode: "contain",
        backgroundColor: "#FAFAFC",
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { dataMode: "device-sms" },
};
export default config;
