import { Pressable, View, StyleSheet } from "react-native";
import { ArrowUpRight, MessageSquareText, Clock3, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { Txt, Enter } from "./ui";
import { colors, fonts } from "../theme/tokens";
import type { SmsThread } from "../services/sms-service";

export function RecentConversation({thread,index}:{thread:SmsThread;index:number}) {
  const pending=thread.pending>0;
  return <Enter delay={Math.min(index*35,140)}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${thread.sender}, ${thread.count} messages${pending?`, ${thread.pending} waiting for model`:""}`} onPress={()=>router.push({pathname:"/sms/[id]",params:{id:thread.id}})} style={({pressed})=>[styles.card,{backgroundColor:pressed?colors.brandSoft:colors.paper,transform:[{scale:pressed?0.985:1}]}]}>
    <View style={{flexDirection:"row",gap:12,alignItems:"center"}}>
      <View style={styles.avatar}><MessageSquareText size={22} color={colors.brand} strokeWidth={1.7}/></View>
      <View style={{flex:1,gap:4}}><Txt style={{fontFamily:fonts.extra,fontSize:16,letterSpacing:-0.3}} numberOfLines={1}>{thread.sender}</Txt><Txt variant="small" color={colors.muted}>{new Date(thread.received).toLocaleDateString(undefined,{month:"short",day:"numeric"})} · {new Date(thread.received).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</Txt></View>
      <ArrowUpRight size={19} color={colors.ink}/>
    </View>
    <View style={{height:1,backgroundColor:colors.line}}/>
    <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <View style={{flexDirection:"row",alignItems:"baseline",gap:5}}><Txt style={{fontFamily:fonts.extra,fontSize:22,lineHeight:28}}>{thread.count}</Txt><Txt variant="small" color={colors.muted}>{thread.count===1?"message":"messages"}</Txt></View>
      <View style={{flexDirection:"row",gap:5,alignItems:"center",backgroundColor:pending?colors.amberSoft:colors.brandSoft,paddingHorizontal:10,paddingVertical:7,borderRadius:12}}>{pending?<Clock3 size={13} color={colors.amber}/>:<ArrowRight size={13} color={colors.brand}/>}<Txt variant="small" color={pending?colors.amber:colors.brand}>{pending?`${thread.pending} queued`:"Open reports"}</Txt></View>
    </View>
  </Pressable></Enter>;
}
const styles=StyleSheet.create({
  card:{borderRadius:22,borderWidth:1,borderColor:colors.line,padding:18,gap:16},
  avatar:{height:48,width:48,borderRadius:17,backgroundColor:colors.brandSoft,alignItems:"center",justifyContent:"center"},
});
