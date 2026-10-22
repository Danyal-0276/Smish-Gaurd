import { Screen, BackHeader, Txt, Card, Notice } from "../components/ui";
import { colors } from "../theme/tokens";
export default function Privacy() {
  return (
    <Screen>
      <BackHeader title="Your privacy" />
      <Txt variant="heading">Your messages.{"\n"}Your controls.</Txt>
      <Card>
        <Txt variant="title">On your phone</Txt>
        <Txt color={colors.muted}>
          Received SMS text and sender addresses are encrypted with AES-GCM
          using an Android Keystore key. Reports, timestamps and queue state
          stay in private app storage. Local copies expire after 30 days and
          storage is capped at 5,000 messages. Device backup is disabled.
        </Txt>
      </Card>
      <Card>
        <Txt variant="title">When connected</Txt>
        <Txt color={colors.muted}>
          If you enable automatic model reports during setup, imported and
          incoming message text is sent to Django when reachable. The app never
          sends sender numbers, contacts or SIM identifiers. Text may itself
          contain personal details; the backend processes it transiently without
          saving message bodies or retraining from them. Detected OTP/code
          messages are excluded, but text detection is not infallible.
        </Txt>
      </Card>
      <Card>
        <Txt variant="title">Offline findings</Txt>
        <Txt color={colors.muted}>
          Offline checks use English keyword and link rules, not the trained
          model. A message without matching patterns may still be malicious. The
          backend model is evaluated on an English SMS benchmark and can also
          miss scams.
        </Txt>
      </Card>
      <Card>
        <Txt variant="title">Your choices</Txt>
        <Txt color={colors.muted}>
          Pause uploads, stop protection, revoke Android permissions, or delete
          local reports in Settings. Deleting a local report removes its queued
          request. Requests already sent cannot be recalled. Uninstalling
          deletes local app data. Original SMS messages are never deleted by
          SmishGuard.
        </Txt>
      </Card>
      <Notice>
        No WhatsApp access, message blocking, personal account, contact-book
        access or SIM tracking. Release connections require HTTPS; local USB
        development uses loopback HTTP.
      </Notice>
    </Screen>
  );
}
