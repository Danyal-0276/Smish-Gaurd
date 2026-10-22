import { useState } from "react";
import { View, Pressable } from "react-native";
import { Card, Txt, Pill, Button, ConfirmSheet } from "./ui";
import { colors } from "../theme/tokens";
import { refreshSms, smsNative, type SmsMessage } from "../services/sms-service";
import { parseSmsReport, localReasons, queueLabel } from "../services/sms-contract";
export function SmsReport({message,onDelete}: {message:SmsMessage;onDelete:()=>void}) {
  const [expanded,setExpanded] = useState(false); const [confirm,setConfirm] = useState(false);
  const [error,setError] = useState("");
  const report = parseSmsReport(message.report);
  const risk = report?.risk ?? message.localRisk;
  return <Card>
    <View style={{flexDirection:"row",justifyContent:"space-between",gap:8}}><Pill label={message.source === "incoming" ? "NEW ARRIVAL" : message.source === "existing" ? "EXISTING SMS" : "PASTED MESSAGE"} /><Txt variant="small" color={colors.muted}>{new Date(message.received).toLocaleString()}</Txt></View>
    <Txt variant="title">{message.sender}</Txt>
    <Pill label={risk === "high" ? "WARNING SIGNS" : risk === "review" ? "TAKE A CLOSER LOOK" : "NO SIGNALS FOUND"} tone={risk === "high" ? "danger" : risk === "review" ? "amber" : "neutral"} />
    <Txt variant="small" color={colors.muted}>{queueLabel(message.state)}</Txt>
    <Txt variant="label" color={colors.brand}>OFFLINE OBSERVATIONS</Txt>
    {localReasons(message.reasons).map(reason=><Txt key={reason} variant="small">{reason}</Txt>)}
    {!localReasons(message.reasons).length && <Txt variant="small" color={colors.muted}>No configured English rule matched. This does not establish that the message is safe.</Txt>}
    {report && <View style={{gap:8,backgroundColor:colors.brandSoft,padding:14,borderRadius:16}}>
      <Txt variant="label" color={colors.brand}>MODEL REPORT</Txt>
      <Txt variant="small">{report.advice}</Txt>
      {report.indicators.map((item,i)=><Txt key={i} variant="small">{item.title}: {item.description}</Txt>)}
      <Txt variant="small" color={colors.muted}>{report.model_version}</Txt>
    </View>}
    <Pressable accessibilityRole="button" onPress={()=>setExpanded(!expanded)}><Txt color={colors.brand}>{expanded ? "Hide message" : "Show message"}</Txt></Pressable>
    {expanded && <Txt selectable>{message.text}</Txt>}
    <Txt variant="small" color={colors.muted}>No link was opened. Neither result proves sender identity or safety.</Txt>
    <Button label="Delete local report" tone="secondary" onPress={()=>setConfirm(true)} />
    {!!error && <Txt color={colors.danger}>{error}</Txt>}
    <ConfirmSheet visible={confirm} title="Delete local report?" body="Remove this app’s message copy, pending model request and report. Your original SMS stays in your messaging app. A request already in transit cannot be recalled." confirmLabel="Delete report" onClose={()=>setConfirm(false)} onConfirm={()=>{void smsNative().deleteMessage(message.id).then(async()=>{await refreshSms();onDelete();}).catch(()=>setError("Could not delete this report."));}} />
  </Card>;
}

