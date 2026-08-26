import type {
  Confidence,
  ErrorCategory,
  ErrorKind,
  Exercise,
} from "@/content/types";
import {
  getArticle,
  isAdjacentTransposition,
  levenshtein,
  normalizeAnswer,
  stripArticle,
} from "@/lib/german";

export type ErrorRecord = {
  id: string;
  errorKind: ErrorKind;
  errorCategory: ErrorCategory;
  target: string;
  userAnswer: string;
  confidence: Confidence;
  attempts: number;
  correctStreak: number;
  lastSeen: number;
  firstSeen: number;
  conceptId?: string;
  lessonKey?: string;
  prompt?: string;
};

export type AnswerPayload = {
  exercise: Exercise;
  given: string;
  correct: boolean;
  lessonKey?: string;
};

const ARTICLES = new Set(["der", "die", "das"]);
const SEIN_FORMS = new Set(["bin", "bist", "ist", "sind", "seid", "sein"]);

function expectedText(exercise: Exercise): string {
  if (exercise.type === "true-false") return String(exercise.answer);
  if (exercise.type === "matching") {
    return exercise.pairs.map((pair) => `${pair.left} = ${pair.right}`).join("; ");
  }
  if (exercise.type === "drag-order") return exercise.answer.join(" ");
  if (exercise.type === "free-production") return exercise.sample;
  const answer = exercise.answer;
  return Array.isArray(answer) ? String(answer[0] ?? "") : String(answer ?? "");
}

function firstWord(value: string): string {
  return normalizeAnswer(value).split(" ")[0] ?? "";
}

export function errorKey(category: ErrorCategory, target: string): string {
  return `${category}::${normalizeAnswer(target) || target}`;
}

function categoryFor(exercise: Exercise, expected: string): ErrorCategory {
  if (exercise.errorCategory) return exercise.errorCategory;
  if (exercise.type === "drag-order") return "word-order";
  const article = getArticle(expected) ?? (ARTICLES.has(normalizeAnswer(expected)) ? normalizeAnswer(expected) : null);
  if (article && expected.split(" ").length <= 3) return "noun-gender";
  if (SEIN_FORMS.has(firstWord(expected)) || /^(ich bin|du bist|er ist|sie ist)/i.test(expected)) {
    return "verb-conjugation";
  }
  if (exercise.modality === "recall" || exercise.modality === "translation") return "vocabulary";
  return "other";
}

export function classifyAnswer(
  given: string,
  exercise: Exercise,
): { kind: ErrorKind; category: ErrorCategory; target: string } {
  const expected = expectedText(exercise);
  const target = exercise.target ?? expected;
  const category = categoryFor(exercise, expected);
  const got = normalizeAnswer(given);
  const want = normalizeAnswer(expected);

  const gotArt = ARTICLES.has(firstWord(given)) ? firstWord(given) : getArticle(given);
  const wantArt = ARTICLES.has(firstWord(expected)) ? firstWord(expected) : getArticle(expected);
  const sameNoun =
    Boolean(gotArt && wantArt) &&
    normalizeAnswer(stripArticle(given)) === normalizeAnswer(stripArticle(expected)) &&
    gotArt !== wantArt;
  if (sameNoun || (ARTICLES.has(got) && ARTICLES.has(want) && got !== want)) {
    return { kind: "misunderstood-grammar", category: "noun-gender", target };
  }

  if (exercise.type === "drag-order") {
    const givenTokens = normalizeAnswer(given).split(" ").filter(Boolean).sort();
    const wantTokens = exercise.answer.map((item) => normalizeAnswer(item)).sort();
    if (
      givenTokens.length === wantTokens.length &&
      givenTokens.every((token, i) => token === wantTokens[i])
    ) {
      return { kind: "word-order-error", category: "word-order", target };
    }
  }

  if (SEIN_FORMS.has(got) && SEIN_FORMS.has(want) && got !== want) {
    return { kind: "misunderstood-grammar", category: "verb-conjugation", target };
  }

  const dist = levenshtein(got, want);
  if (got && want && dist > 0 && dist <= 2) {
    if (isAdjacentTransposition(got, want) || dist === 1 && Math.abs(got.length - want.length) <= 1) {
      if (isAdjacentTransposition(got, want)) {
        return { kind: "careless-mistake", category, target };
      }
    }
    if (dist <= 2 && Math.min(got.length, want.length) >= 3) {
      return { kind: "spelling-error", category: category === "vocabulary" ? "spelling" : category, target };
    }
  }

  if (exercise.modality === "recognition" || exercise.type === "multiple-choice" || exercise.type === "listen-choice") {
    return { kind: "forgotten-vocabulary", category: category === "other" ? "vocabulary" : category, target };
  }

  if (exercise.modality === "recall" || exercise.modality === "translation" || exercise.type === "type-answer") {
    if (dist > 3) return { kind: "forgotten-vocabulary", category: category === "other" ? "vocabulary" : category, target };
  }

  if (exercise.modality === "construction" || exercise.type === "drag-order") {
    return { kind: "word-order-error", category: "word-order", target };
  }

  return { kind: "misunderstood-grammar", category, target };
}

function nextConfidence(attempts: number, kind: ErrorKind): Confidence {
  if (kind === "careless-mistake" && attempts <= 1) return "high";
  if (attempts >= 2) return "low";
  return "medium";
}

export function applyAnswer(
  errors: Record<string, ErrorRecord>,
  payload: AnswerPayload,
): Record<string, ErrorRecord> {
  const now = Date.now();
  const expected = expectedText(payload.exercise);
  const target = payload.exercise.target ?? expected;
  const classified = payload.correct
    ? {
        kind: "forgotten-vocabulary" as ErrorKind,
        category: categoryFor(payload.exercise, expected),
        target,
      }
    : classifyAnswer(payload.given, payload.exercise);
  const id = errorKey(classified.category, classified.target);
  const previous = errors[id];

  if (payload.correct) {
    if (!previous) return errors;
    return {
      ...errors,
      [id]: {
        ...previous,
        lastSeen: now,
        correctStreak: previous.correctStreak + 1,
        confidence: previous.correctStreak + 1 >= 2 ? "high" : previous.confidence,
      },
    };
  }

  const attempts = (previous?.attempts ?? 0) + 1;
  const next: ErrorRecord = {
    id,
    errorKind: classified.kind,
    errorCategory: classified.category,
    target: classified.target,
    userAnswer: payload.given,
    confidence: nextConfidence(attempts, classified.kind),
    attempts,
    correctStreak: 0,
    lastSeen: now,
    firstSeen: previous?.firstSeen ?? now,
    conceptId: payload.exercise.conceptId ?? previous?.conceptId,
    lessonKey: payload.lessonKey ?? previous?.lessonKey,
    prompt: payload.exercise.prompt,
  };
  return { ...errors, [id]: next };
}

export function activeErrors(errors: Record<string, ErrorRecord>): ErrorRecord[] {
  return Object.values(errors)
    .filter((item) => item.correctStreak < 3 && item.attempts > 0)
    .sort((a, b) => {
      const rank = { low: 0, medium: 1, high: 2 };
      if (rank[a.confidence] !== rank[b.confidence]) {
        return rank[a.confidence] - rank[b.confidence];
      }
      if (b.attempts !== a.attempts) return b.attempts - a.attempts;
      return a.lastSeen - b.lastSeen;
    });
}

export type ErrorInsight = {
  headline: string;
  detail: string;
  category: ErrorCategory;
  kind: ErrorKind;
  attempts: number;
  lastSeen: number;
  targets: string[];
};

const CATEGORY_LABEL: Record<ErrorCategory, string> = {
  "noun-gender": "feminine and other noun articles",
  "verb-conjugation": "verb forms",
  "word-order": "German word order",
  vocabulary: "vocabulary",
  spelling: "spelling",
  articles: "articles",
  case: "case",
  other: "this pattern",
};

export function formatLastSeen(at: number, now = Date.now()): string {
  const days = Math.floor((now - at) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function errorInsights(errors: Record<string, ErrorRecord>, now = Date.now()): ErrorInsight[] {
  const groups = new Map<string, ErrorRecord[]>();
  for (const record of activeErrors(errors)) {
    const key = `${record.errorKind}::${record.errorCategory}`;
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }
  const insights: ErrorInsight[] = [];
  for (const group of groups.values()) {
    const total = group.reduce((sum, item) => sum + item.attempts, 0);
    if (total < 2 && group.length < 2) continue;
    const sample = group[0];
    const feminine =
      sample.errorCategory === "noun-gender" &&
      group.some((item) => /(?:^die\s)|(?:\bdie\b)/i.test(item.target) || item.userAnswer.toLowerCase().includes("der"));
    const headline =
      feminine && sample.errorCategory === "noun-gender"
        ? "You repeatedly confuse feminine noun articles."
        : sample.errorKind === "forgotten-vocabulary"
          ? "Some words are slipping from memory."
          : sample.errorKind === "misunderstood-grammar"
            ? `The pattern around ${CATEGORY_LABEL[sample.errorCategory]} is still shaky.`
            : sample.errorKind === "spelling-error"
              ? "Spelling of known words needs a closer look."
              : sample.errorKind === "word-order-error"
                ? "Word order is the part that keeps slipping."
                : "A few careless slips are showing up.";
    insights.push({
      headline,
      detail: `${group.length} target${group.length === 1 ? "" : "s"} · last seen ${formatLastSeen(Math.max(...group.map((item) => item.lastSeen)), now)}`,
      category: sample.errorCategory,
      kind: sample.errorKind,
      attempts: total,
      lastSeen: Math.max(...group.map((item) => item.lastSeen)),
      targets: group.map((item) => item.target).slice(0, 4),
    });
  }
  return insights.sort((a, b) => b.attempts - a.attempts).slice(0, 6);
}
