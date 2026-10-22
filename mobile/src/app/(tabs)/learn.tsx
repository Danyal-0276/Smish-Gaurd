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
          SMALL LESSONS. BETTER INSTINCTS.
        </Txt>
        <Txt variant="heading">Stay curious.{"\n"}Stay a step ahead.</Txt>
        <Txt color={colors.muted}>
          A few minutes now can make the next message easier to read.
        </Txt>
      </View>
      <Enter>
        <View
          style={{
            backgroundColor: colors.forest,
            borderRadius: 26,
            padding: 24,
            gap: 16,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <BookOpen size={25} color={colors.lime} strokeWidth={1.5} />
            <Txt variant="small" color={colors.lime}>
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
            style={{ height: 5, backgroundColor: "#446657", borderRadius: 99 }}
          >
            <View
              style={{
                height: 5,
                width: `${(completed.length / lessons.length) * 100}%`,
                backgroundColor: colors.lime,
                borderRadius: 99,
              }}
            />
          </View>
          <Txt variant="small" color="#CAD7CF">
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
                <ArrowUpRight size={19} color={colors.forest} />
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
      <Card style={{ backgroundColor: "#EEEDE2" }}>
        <Lightbulb size={21} color={colors.forest} />
        <Txt variant="title">The strongest habit?</Txt>
        <Txt color={colors.muted}>
          Verify an unexpected request through a channel you chose yourself.
        </Txt>
      </Card>
    </Screen>
  );
}
