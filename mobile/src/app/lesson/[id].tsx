import { useState } from "react";
import { View, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Check, ArrowRight } from "lucide-react-native";
import {
  Screen,
  Txt,
  BackHeader,
  Pill,
  Button,
  Card,
  Enter,
} from "../../components/ui";
import { colors, fonts } from "../../theme/tokens";
import { lessons } from "../../data/fixtures";
import { useAppStore } from "../../store/app-store";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessons.find((l) => l.id === id);
  const [answer, setAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const complete = useAppStore((s) => s.completeLesson);
  if (!lesson)
    return (
      <Screen>
        <BackHeader title="Field guide" />
        <Txt variant="heading">Lesson not found.</Txt>
      </Screen>
    );
  const correct = answer === lesson.correctIndex;
  return (
    <Screen>
      <BackHeader title="Field guide" />
      <View style={{ gap: 12 }}>
        <Pill label={`${lesson.category} · ${lesson.duration} MIN`} />
        <Txt variant="display" style={{ fontSize: 32, lineHeight: 41 }}>
          {lesson.title}
        </Txt>
        <Txt color={colors.muted}>{lesson.summary}</Txt>
      </View>
      {lesson.sections.map((section, i) => (
        <View key={section.heading} style={{ gap: 10, paddingBottom: 12 }}>
          <Txt variant="label" color={colors.muted}>
            FIELD NOTE {String(i + 1).padStart(2, "0")}
          </Txt>
          <Txt variant="title">{section.heading}</Txt>
          <Txt color={colors.muted}>{section.body}</Txt>
        </View>
      ))}
      <Card style={{ backgroundColor: colors.brandSoft, gap: 16 }}>
        <Txt variant="label" color={colors.brand}>
          A QUICK CHECK-IN
        </Txt>
        <Txt variant="title">{lesson.question}</Txt>
        {lesson.options.map((option, i) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: answer === i }}
            disabled={revealed}
            onPress={() => setAnswer(i)}
            style={{
              padding: 15,
              borderRadius: 15,
              backgroundColor: answer === i ? colors.brand : colors.paper,
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Txt
              variant="small"
              color={answer === i ? colors.paper : colors.muted}
            >
              {String.fromCharCode(65 + i)}
            </Txt>
            <Txt
              style={{ flex: 1, fontFamily: fonts.medium, fontSize: 13 }}
              color={answer === i ? colors.paper : colors.ink}
            >
              {option}
            </Txt>
          </Pressable>
        ))}
        {revealed && (
          <Enter>
            <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
              <Txt
                style={{ fontFamily: fonts.bold }}
                color={correct ? colors.green : colors.amber}
              >
                {correct
                  ? "That’s a helpful instinct."
                  : "A useful moment to reconsider."}
              </Txt>
              <Txt color={colors.muted} variant="small">
                {lesson.explanation}
              </Txt>
            </View>
          </Enter>
        )}
        {!revealed ? (
          <Button
            label="Check my answer"
            disabled={answer === null}
            icon={Check}
            onPress={() => {
              setRevealed(true);
              if (correct) complete(lesson.id);
            }}
          />
        ) : correct ? (
          <Button
            label="Back to the field guide"
            icon={ArrowRight}
            onPress={() => router.back()}
          />
        ) : (
          <Button
            label="Try again"
            tone="secondary"
            onPress={() => {
              setRevealed(false);
              setAnswer(null);
            }}
          />
        )}
      </Card>
    </Screen>
  );
}
