import type { ErrorCategory, Exercise, Lesson } from "@/content/types";
import { getArticle, seededShuffle, stripArticle } from "@/lib/german";
import { activeErrors, type ErrorRecord } from "@/lib/errors";

function fillArticle(record: ErrorRecord, index: number): Exercise {
  const noun = stripArticle(record.target) || record.target;
  const article = getArticle(record.target) ?? "die";
  return {
    type: "fill-blank",
    id: `target-art-${index}-${record.id}`,
    prompt: "Fill in the correct article.",
    sentence: `___ ${noun}`,
    answer: article,
    options: seededShuffle(["der", "die", "das"], `t-art-${record.id}`),
    hint: "Gender is part of the word.",
    speak: record.target,
    conceptId: record.conceptId,
    modality: "completion",
    phase: "review",
    target: record.target,
    errorCategory: "noun-gender",
    targeted: true,
  };
}

function typeRecall(record: ErrorRecord, index: number): Exercise {
  return {
    type: "type-answer",
    id: `target-type-${index}-${record.id}`,
    prompt: record.prompt?.startsWith("How do you say")
      ? record.prompt
      : `How do you say this in German? Target: ${record.target}`,
    answer: [record.target, stripArticle(record.target)],
    hint: record.errorKind === "spelling-error" ? "Watch the spelling, including umlauts." : undefined,
    speak: record.target,
    conceptId: record.conceptId,
    modality: "recall",
    phase: "recall",
    target: record.target,
    errorCategory: record.errorCategory,
    targeted: true,
  };
}

function orderFromTarget(record: ErrorRecord, index: number): Exercise | null {
  const words = record.target.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  return {
    type: "drag-order",
    id: `target-order-${index}-${record.id}`,
    prompt: "Rebuild the sentence. Verb in position two.",
    words: seededShuffle(words, `t-ord-${record.id}`),
    answer: words,
    speak: record.target,
    conceptId: record.conceptId,
    modality: "construction",
    phase: "controlled-practice",
    target: record.target,
    errorCategory: "word-order",
    targeted: true,
  };
}

export function exerciseFromError(record: ErrorRecord, index: number): Exercise {
  if (record.errorCategory === "noun-gender" || record.errorCategory === "articles") {
    return fillArticle(record, index);
  }
  if (record.errorKind === "word-order-error" || record.errorCategory === "word-order") {
    return orderFromTarget(record, index) ?? typeRecall(record, index);
  }
  return typeRecall(record, index);
}

export function targetedExercises(
  errors: Record<string, ErrorRecord>,
  limit = 8,
): Exercise[] {
  return activeErrors(errors)
    .slice(0, limit)
    .map((record, index) => exerciseFromError(record, index));
}

function alreadyTests(exercise: Exercise, target: string): boolean {
  const needle = target.toLowerCase();
  if (exercise.target?.toLowerCase() === needle) return true;
  if ("speak" in exercise && exercise.speak?.toLowerCase().includes(needle)) return true;
  if ("answer" in exercise) {
    const answer = exercise.answer;
    if (typeof answer === "string" && answer.toLowerCase().includes(needle)) return true;
    if (Array.isArray(answer) && answer.some((item) => String(item).toLowerCase().includes(needle))) {
      return true;
    }
  }
  return false;
}

export function injectTargetedExercises(
  lesson: Lesson,
  errors: Record<string, ErrorRecord>,
  maxInject = 2,
): Exercise[] {
  if (lesson.number === 1 || lesson.role === "introduction") return lesson.exercises;
  const needed = targetedExercises(errors, maxInject + 2).filter((item) => {
    const target = item.target ?? "";
    return target && !lesson.exercises.some((exercise) => alreadyTests(exercise, target));
  });
  const extras = needed.slice(0, maxInject);
  if (!extras.length) return lesson.exercises;
  const at = Math.min(2, lesson.exercises.length);
  return [...lesson.exercises.slice(0, at), ...extras, ...lesson.exercises.slice(at)];
}

export function categoryLabel(category: ErrorCategory): string {
  switch (category) {
    case "noun-gender":
      return "noun gender";
    case "verb-conjugation":
      return "verb conjugation";
    case "word-order":
      return "word order";
    default:
      return category.replace("-", " ");
  }
}
