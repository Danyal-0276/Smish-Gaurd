import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, Check, BookOpen, Lightbulb } from "lucide-react-native";
import { Screen, Txt, Pill, Card, Enter } from "../../components/ui";
import { lessons } from "../../data/fixtures";
import { useAppStore } from "../../store/app-store";
import { colors, fonts } from "../../theme/tokens";

export default function Learn() {
  const completed = useAppStore((s) => s.completedLessons);
  return (
    <Screen>
      <View style={{ gap: 10 }}>
        <Txt variant="label" color={colors.muted}>
          THE SAFETY NOTES
        </Txt>
        <Txt variant="heading">
          Small lessons.{"\n"}
          <Txt variant="heading" color={colors.brand}>
            Smarter habits.
          </Txt>
        </Txt>
        <Txt color={colors.muted}>
          Four short reads. Practical steps you can use today.
        </Txt>
      </View>
      <Enter>
        <View
          style={{
            backgroundColor: colors.brand,
            borderRadius: 26,
            padding: 24,
            gap: 16,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <BookOpen size={25} color={colors.accent} strokeWidth={1.5} />
            <Txt variant="small" color={colors.paper}>
              {completed.length} / {lessons.length} complete
            </Txt>
          </View>
          <Txt variant="title" color={colors.paper}>
            Confidence grows with practice.
          </Txt>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: lessons.length,
              now: completed.length,
            }}
            style={{
              height: 5,
              backgroundColor: colors.brandDark,
              borderRadius: 99,
            }}
          >
            <View
              style={{
                height: 5,
                width: `${(completed.length / lessons.length) * 100}%`,
                backgroundColor: colors.accent,
                borderRadius: 99,
              }}
            />
          </View>
          <Txt variant="small" color={colors.onDark}>
            Short reads. One question. Something useful to keep.
          </Txt>
        </View>
      </Enter>
      <Txt variant="title">Your field guide</Txt>
      {lessons.map((lesson, index) => (
        <Enter key={lesson.id} delay={index * 35}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/lesson/[id]",
                params: { id: lesson.id },
              })
            }
            style={({ pressed }) => ({
              backgroundColor: colors.paper,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 23,
              padding: 22,
              gap: 14,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Pill label={lesson.category} />
              {completed.includes(lesson.id) ? (
                <Check size={19} color={colors.green} />
              ) : (
                <ArrowUpRight size={19} color={colors.brand} />
              )}
            </View>
            <Txt
              style={{
                fontFamily: fonts.bold,
                fontSize: 20,
                letterSpacing: -0.5,
              }}
            >
              {lesson.title}
            </Txt>
            <Txt color={colors.muted} style={{ fontSize: 13 }}>
              {lesson.summary}
            </Txt>
            <Txt variant="small" color={colors.muted}>
              {String(index + 1).padStart(2, "0")} / FIELD NOTE ·{" "}
              {lesson.duration} min read
            </Txt>
          </Pressable>
        </Enter>
      ))}
      <Card
        style={{
          backgroundColor: colors.brandSoft,
          borderColor: colors.brandSoft,
        }}
      >
        <Lightbulb size={21} color={colors.brand} />
        <Txt variant="title">The strongest habit?</Txt>
        <Txt color={colors.muted}>
          Verify an unexpected request through a channel you chose yourself.
        </Txt>
      </Card>
    </Screen>
  );
}
