import { useEffect, useState, useCallback } from "react";
import { AppState } from "react-native";
import { Txt, Card, Button } from "./ui";
import { SmsReport } from "./sms-report";
import { smsNative, useSmsStore, type SmsMessage } from "../services/sms-service";
import { colors } from "../theme/tokens";
export function SmsFeed({thread=""}:{thread?:string}) {
  const [messages,setMessages] = useState<SmsMessage[]>([]); const [error,setError] = useState("");
  const busy = useSmsStore(s=>s.busy);
  const load = useCallback(async()=>{
    try { const rows = await smsNative().messages(thread); setMessages(rows); setError(""); }
    catch(e) { setMessages([]); setError(e instanceof Error ? e.message : "Could not load reports."); }
  },[thread]);
  useEffect(()=>{void load();const timer=setInterval(()=>{if(AppState.currentState==="active")void load();},5000);return()=>clearInterval(timer);},[load,busy]);
  return <>{!!error && <Txt color={colors.danger}>{error}</Txt>}{messages.map(message=><SmsReport key={message.id} message={message} onDelete={()=>void load()} />)}
    {!messages.length && <Card><Txt color={colors.muted}>No local reports here yet. Allow SMS access and refresh your inbox to get started.</Txt><Button label="Refresh reports" tone="secondary" onPress={()=>void load()} /></Card>}
    {!!messages.length && <Txt variant="small" color={colors.muted}>Showing up to 200 recent reports{thread ? " in this conversation" : ""}.</Txt>}
  </>;
}

