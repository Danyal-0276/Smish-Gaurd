import { View, StyleSheet } from "react-native";
import { MessageSquareText, ScanLine, ShieldAlert, Clock3 } from "lucide-react-native";
import { Txt, Enter } from "./ui";
import { colors, fonts } from "../theme/tokens";
import type { SmsStatus } from "../services/sms-service";

export function HomeMetrics({ status }: { status: SmsStatus | null }) {
  const items = [
    { label: "Messages", value: status?.total, caption: "On this phone", Icon: MessageSquareText, bg: colors.paper, fg: colors.ink, muted: colors.muted },
    { label: "Model reports", value: status?.completed, caption: "Completed checks", Icon: ScanLine, bg: colors.brand, fg: colors.paper, muted: colors.onDark },
    { label: "High risk", value: status?.modelHigh, caption: "Model assessments", Icon: ShieldAlert, bg: colors.accent, fg: colors.ink, muted: colors.ink },
    { label: "Queued", value: status?.pending, caption: status?.cloud ? "Waiting for model" : "Uploads paused", Icon: Clock3, bg: colors.night, fg: colors.paper, muted: colors.dockMuted },
  ];
  return <View style={{ gap: 12 }}>{[0, 2].map(start => <View key={start} style={{flexDirection:"row",gap:12}}>{items.slice(start,start+2).map(({label,value,caption,Icon,bg,fg,muted},index)=><View key={label} style={{flex:1}}><Enter delay={60+(start+index)*40}><View style={[styles.tile,{backgroundColor:bg,borderColor:bg===colors.paper?colors.line:bg}]}>
    <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:6}}><Txt variant="small" color={fg} style={{fontFamily:fonts.bold}}>{label}</Txt><Icon size={17} color={fg} strokeWidth={1.7}/></View>
    <Txt color={fg} style={styles.value}>{value === undefined ? "—" : value.toLocaleString()}</Txt>
    <Txt variant="small" color={muted}>{caption}</Txt>
  </View></Enter></View>)}</View>)}</View>;
}
const styles=StyleSheet.create({
  tile:{borderRadius:22,borderWidth:1,padding:17,gap:9,minHeight:148},
  value:{fontFamily:fonts.extra,fontSize:36,lineHeight:44,letterSpacing:-1.5},
});
