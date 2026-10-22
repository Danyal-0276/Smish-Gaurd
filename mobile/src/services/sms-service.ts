import { requireOptionalNativeModule } from "expo";
import { PermissionsAndroid, Platform } from "react-native";
import { create } from "zustand";
import type { Risk } from "../types/domain";
export interface SmsStatus {
  total: number;
  pending: number;
  completed: number;
  flagged: number;
  enabled: boolean;
  cloud: boolean;
  smsGranted: boolean;
  receiveGranted: boolean;
  notificationsGranted: boolean;
  hasOlder: boolean;
  connection: string;
  modelHigh: number;
  modelReview: number;
  modelLow: number;
  days: { day: string; count: number }[];
}
export interface SmsThread {
  id: string;
  sender: string;
  received: number;
  count: number;
  pending: number;
}
export interface SmsMessage {
  id: string;
  thread: string;
  sender: string;
  text: string;
  received: number;
  source: "existing" | "incoming" | "manual";
  localRisk: Risk;
  reasons: string;
  state: "pending" | "paused" | "completed" | "unsupported" | "local_only";
  report: string | null;
}
interface NativeSms {
  status(): Promise<SmsStatus>;
  configure(endpoint: string, cloud: boolean): Promise<SmsStatus>;
  refresh(older: boolean): Promise<SmsStatus>;
  threads(): Promise<SmsThread[]>;
  messages(thread: string): Promise<SmsMessage[]>;
  manual(text: string): Promise<string>;
  pauseUploads(): Promise<void>;
  stop(): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  clear(): Promise<void>;
}
export function smsNative(): NativeSms {
  const module =
    Platform.OS === "android"
      ? requireOptionalNativeModule<NativeSms>("SmishGuardSms")
      : null;
  if (!module)
    throw new Error(
      "SMS protection needs the rebuilt Android APK. It cannot read SMS in a browser or Expo Go.",
    );
  return module;
}
export async function startProtection(cloud: boolean) {
  const native = smsNative();
  const read = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  );
  if (read !== PermissionsAndroid.RESULTS.GRANTED)
    throw new Error(
      "SMS access was not granted. Enable it in Android App info → Permissions. Android may require the APK installer to allow restricted SMS access.",
    );
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
  if (Number(Platform.Version) >= 33)
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  await native.configure(process.env.EXPO_PUBLIC_API_URL ?? "", cloud);
  await native.refresh(false);
  await refreshSms();
}
export const useSmsStore = create<{
  status: SmsStatus | null;
  threads: SmsThread[];
  error: string;
  busy: boolean;
}>(() => ({ status: null, threads: [], error: "", busy: false }));
let refreshing = false;
export async function refreshSms(importInbox = false, older = false) {
  if (refreshing) return;
  refreshing = true;
  useSmsStore.setState({ busy: true });
  try {
    const native = smsNative();
    const status = importInbox
      ? await native.refresh(older)
      : await native.status();
    const threads = await native.threads();
    useSmsStore.setState({ status, threads, error: "" });
  } catch (error) {
    useSmsStore.setState({
      error:
        error instanceof Error
          ? error.message
          : "Could not read local SMS protection.",
    });
  } finally {
    refreshing = false;
    useSmsStore.setState({ busy: false });
  }
}
