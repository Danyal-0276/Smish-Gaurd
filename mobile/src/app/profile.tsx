import { useCallback, useState } from "react";
import { View, TextInput, PermissionsAndroid, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { UserRound, Smartphone } from "lucide-react-native";
import {
  Screen,
  BackHeader,
  Txt,
  Card,
  Pill,
  Button,
  Notice,
  ConfirmSheet,
} from "../components/ui";
import { colors, fonts } from "../theme/tokens";
import { smsNative } from "../services/sms-service";

export default function Profile() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        try {
          const p = await smsNative().profile();
          if (active) {
            setName(p.name);
            setPhone(p.phone);
          }
        } catch {
          if (active) setError("Profile needs the rebuilt Android app.");
        }
      }
      void load();
      return () => {
        active = false;
      };
    }, []),
  );
  async function suggest() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (Platform.OS !== "android" || Number(Platform.Version) < 26)
        throw new Error("Enter your number manually on this device.");
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
        {
          title: "Use your phone number?",
          message:
            "Read an available number from this phone to fill this optional profile. Review it before saving. It is not sent to our server or verified.",
          buttonPositive: "Continue",
          buttonNegative: "Cancel",
        },
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED)
        throw new Error(
          "Permission was not granted. You can enter your number manually.",
        );
      const number = await smsNative().suggestPhoneNumber();
      if (!number)
        throw new Error(
          "This SIM did not provide a number. Enter it manually.",
        );
      setPhone(number.replace(/[\s()-]/g, ""));
      setMessage(
        "Number suggested. Check the country code and confirm it before saving.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Number unavailable. Enter it manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setError("");
    setMessage("");
    const number = phone.trim().replace(/[\s()-]/g, "");
    if (number && !/^\+[1-9]\d{6,14}$/.test(number)) {
      setError("Use international format, for example +923001234567.");
      return;
    }
    setBusy(true);
    try {
      await smsNative().saveProfile(name.trim(), number);
      setPhone(number);
      setMessage("Profile saved on this phone.");
    } catch {
      setError("Could not securely save this profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <BackHeader title="My profile" />
      <Card
        style={{
          backgroundColor: colors.brand,
          alignItems: "center",
          padding: 28,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 24,
            backgroundColor: colors.paper,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserRound size={30} color={colors.brand} />
        </View>
        <Txt variant="heading" color={colors.paper}>
          {name.trim() || "Your device profile"}
        </Txt>
        <Txt color={colors.paper}>Optional. Private. Yours.</Txt>
      </Card>
      <Pill label="LOCAL PROFILE · NUMBER UNVERIFIED" />
      <Card>
        <Txt variant="label" color={colors.muted}>
          DISPLAY NAME
        </Txt>
        <TextInput
          accessibilityLabel="Display name"
          maxLength={60}
          value={name}
          onChangeText={setName}
          placeholder="Your name (optional)"
          placeholderTextColor={colors.muted}
          style={{
            fontFamily: fonts.medium,
            fontSize: 17,
            color: colors.ink,
            minHeight: 44,
          }}
        />
        <Txt variant="label" color={colors.muted}>
          PHONE NUMBER
        </Txt>
        <TextInput
          accessibilityLabel="Phone number including country code"
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={24}
          value={phone}
          onChangeText={setPhone}
          placeholder="+92… (optional)"
          placeholderTextColor={colors.muted}
          style={{
            fontFamily: fonts.medium,
            fontSize: 17,
            color: colors.ink,
            minHeight: 44,
          }}
        />
        <Button
          label="Use this phone’s number"
          icon={Smartphone}
          tone="secondary"
          loading={busy}
          disabled={busy}
          onPress={() => void suggest()}
        />
      </Card>
      <Notice>
        The SIM may not provide a number. A saved or suggested number does not
        verify ownership or prove a sender is genuine.
      </Notice>
      {!!message && (
        <Txt color={colors.brand} accessibilityLiveRegion="polite">
          {message}
        </Txt>
      )}
      {!!error && (
        <Txt color={colors.danger} accessibilityRole="alert">
          {error}
        </Txt>
      )}
      <Button
        label="Save profile on this phone"
        loading={busy}
        disabled={busy}
        onPress={() => void save()}
      />
      <Button
        label="Delete profile"
        tone="secondary"
        disabled={busy}
        onPress={() => setConfirm(true)}
      />
      <Notice>
        Name and number are encrypted locally. They are not attached to model
        requests or shown to staff. SMS protection works without this profile.
      </Notice>
      <ConfirmSheet
        visible={confirm}
        title="Delete this profile?"
        body="Remove the saved name and number. SMS reports and protection settings stay on this phone."
        confirmLabel="Delete profile"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          void smsNative()
            .deleteProfile()
            .then(() => {
              setName("");
              setPhone("");
              setMessage("Profile deleted.");
            })
            .catch(() => setError("Could not delete profile."));
        }}
      />
    </Screen>
  );
}
