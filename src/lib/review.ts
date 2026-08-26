import type { Exercise, Lesson } from "@/content/types";
import { normalizeAnswer, stripArticle } from "@/lib/german";

export type TaughtLesson = {
  id: string;
  number: number;
  title: string;
};

const TYPE_FALLBACK: Record<Exercise["type"], number> = {
  "type-answer": 3,
  "fill-blank": 5,
  matching: 2,
  "drag-order": 7,
  "listen-choice": 8,
  "true-false": 11,
  "multiple-choice": 2,
  "free-production": 17,
};

function addKey(keys: Set<string>, value?: string) {
  if (!value) return;
  const normalized = normalizeAnswer(value);
  if (normalized.length < 2) return;
  keys.add(normalized);
  const stripped = normalizeAnswer(stripArticle(value));
  if (stripped.length >= 2) keys.add(stripped);
}

function lessonKeys(lesson: Lesson): Set<string> {
  const keys = new Set<string>();
  for (const card of lesson.teaching ?? []) {
    addKey(keys, card.speak);
    addKey(keys, card.body);
    addKey(keys, card.translation);
    for (const row of card.rows ?? []) {
      addKey(keys, row.de);
      addKey(keys, row.en);
    }
    for (const point of card.points ?? []) addKey(keys, point);
  }
  if (lesson.passage) {
    addKey(keys, lesson.passage.text);
    addKey(keys, lesson.passage.translation);
    for (const part of lesson.passage.text.split(/[.!?]/)) addKey(keys, part.trim());
    for (const part of lesson.passage.translation.split(/[.!?]/)) addKey(keys, part.trim());
  }
  addKey(keys, lesson.grammarNote);
  for (const item of lesson.newVocab ?? []) {
    addKey(keys, item.de);
    addKey(keys, item.en);
  }
  for (const item of lesson.recycledVocab ?? []) {
    addKey(keys, item.de);
    addKey(keys, item.en);
  }
  return keys;
}

function needlesFor(exercise: Exercise): string[] {
  const keys = new Set<string>();
  if ("speak" in exercise) addKey(keys, exercise.speak);
  if ("translation" in exercise) addKey(keys, exercise.translation);
  if ("statement" in exercise) addKey(keys, exercise.statement);
  if ("answer" in exercise) {
    const answer = exercise.answer;
    if (typeof answer === "string") addKey(keys, answer);
    else if (Array.isArray(answer)) {
      if (typeof answer[0] === "string") {
        for (const item of answer) addKey(keys, item);
        if (exercise.type === "drag-order") addKey(keys, answer.join(" "));
      }
    } else if (typeof answer === "boolean") {
      addKey(keys, exercise.statement);
    }
  }
  if (exercise.type === "matching") {
    for (const pair of exercise.pairs) {
      addKey(keys, pair.left);
      addKey(keys, pair.right);
    }
  }
  if (exercise.type === "fill-blank") {
    const rest = exercise.sentence.replaceAll("___", "").trim();
    addKey(keys, rest);
    const hole = Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer;
    addKey(keys, `${hole} ${rest}`.trim());
  }
  if (exercise.type === "free-production") {
    addKey(keys, exercise.sample);
    addKey(keys, exercise.prompt);
  }
  if (exercise.target) addKey(keys, exercise.target);
  return [...keys];
}

function fallbackNumber(exercise: Exercise): number {
  const prompt = exercise.prompt.toLowerCase();
  if (prompt.includes("phrase")) {
    return prompt.includes("rebuild") || prompt.includes("write") ? 10 : 9;
  }
  if (prompt.includes("article")) return 5;
  if (
    prompt.includes("text") ||
    prompt.includes("passage") ||
    prompt.includes("this line") ||
    prompt.includes("mainly about")
  ) {
    return 13;
  }
  if (exercise.type === "listen-choice" && "speak" in exercise && exercise.speak.includes(" ")) {
    return 7;
  }
  if (exercise.type === "type-answer") {
    const sample = Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer;
    if (sample && (/[äöüßÄÖÜ]/.test(sample) || /^(der|die|das)\s/i.test(sample))) {
      return 3;
    }
  }
  return TYPE_FALLBACK[exercise.type];
}

function byNumber(lessons: Lesson[], number: number): TaughtLesson | null {
  const lesson = lessons.find((item) => item.number === number);
  if (!lesson) return null;
  return { id: lesson.id, number: lesson.number, title: lesson.title };
}

export function findTaughtLesson(
  exercise: Exercise,
  lessons: Lesson[],
  currentLessonId: string,
): TaughtLesson | null {
  const current = lessons.find((item) => item.id === currentLessonId);
  const currentNumber = current?.number ?? Number.POSITIVE_INFINITY;
  const needles = needlesFor(exercise);
  const hits: TaughtLesson[] = [];
  for (const lesson of lessons) {
    const keys = lessonKeys(lesson);
    const matched = needles.some((needle) => {
      if (keys.has(needle)) return true;
      if (needle.length < 4) return false;
      for (const key of keys) {
        if (key.includes(needle) || needle.includes(key)) return true;
      }
      return false;
    });
    if (matched) {
      hits.push({ id: lesson.id, number: lesson.number, title: lesson.title });
    }
  }
  const prior = hits
    .filter((item) => item.number < currentNumber)
    .sort((a, b) => a.number - b.number);
  if (prior[0]) return prior[0];
  if (current && hits.some((item) => item.id === current.id)) {
    return { id: current.id, number: current.number, title: current.title };
  }
  const fallback = fallbackNumber(exercise);
  if (fallback < currentNumber) return byNumber(lessons, fallback);
  return null;
}
