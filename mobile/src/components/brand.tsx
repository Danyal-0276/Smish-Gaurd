import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../theme/tokens";

export function BrandMark({
  size = 44,
  color = colors.forest,
  tile = false,
}: {
  size?: number;
  color?: string;
  tile?: boolean;
}) {
  return (
    <View
      accessibilityLabel="SmishGuard conversation shield"
      style={
        tile
          ? {
              backgroundColor: colors.sage,
              borderRadius: size * 0.3,
              padding: size * 0.2,
            }
          : undefined
      }
    >
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Path
          d="M32 5 53 13v17c0 13-9 23-21 29C20 53 11 43 11 30V13L32 5Z"
          stroke={color}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <Path
          d="M40 22H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="m28 37-6 6v-9M35 22l7-6"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function ShieldIllustration({ compact = false }: { compact?: boolean }) {
  const size = compact ? 160 : 248;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        style={StyleSheet.absoluteFill}
        width={size}
        height={size}
        viewBox="0 0 248 248"
      >
        <Circle
          cx="124"
          cy="124"
          r="116"
          fill="none"
          stroke="#547563"
          strokeWidth="1"
          opacity=".45"
        />
        <Circle
          cx="124"
          cy="124"
          r="89"
          fill="none"
          stroke="#789180"
          strokeWidth="1"
          opacity=".5"
        />
        <Circle cx="124" cy="124" r="62" fill="#315B49" />
        <Circle cx="218" cy="65" r="6" fill={colors.lime} />
        <Circle cx="34" cy="166" r="4" fill="#91AE82" />
      </Svg>
      <BrandMark size={compact ? 62 : 86} color={colors.lime} />
    </View>
  );
}
