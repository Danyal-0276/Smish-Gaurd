import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "SmishGuard",
  slug: "smishguard",
  version: "0.1.0",
  scheme: "smishguard",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/brand/icon.png",
  android: {
    package: "com.smishguard.app",
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: "./assets/brand/adaptive-foreground.png",
      backgroundColor: "#234D40",
      monochromeImage: "./assets/brand/monochrome.png",
    },
    blockedPermissions: [
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
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
    './plugins/with-short-cmake-paths',
    "expo-router",
    "expo-font",
    "expo-sqlite",
    [
      "expo-splash-screen",
      {
        image: "./assets/brand/splash-mark.png",
        imageWidth: 100,
        resizeMode: "contain",
        backgroundColor: "#F6F7F2",
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { dataMode: "demo" },
};
export default config;
