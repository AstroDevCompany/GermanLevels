import type { WritingRubric, WritingRegister } from "@/content/types";
import { normalizeAnswer } from "@/lib/german";

export type RubricScores = {
  content: number;
  cohesion: number;
  vocabulary: number;
  accuracy: number;
  overall: number;
  passed: boolean;
  wordCount: number;
  notes: string[];
};

const CONNECTORS = [
  "und",
  "aber",
  "oder",
  "weil",
  "dass",
  "wenn",
  "dann",
  "deshalb",
  "darum",
  "trotzdem",
  "obwohl",
  "außerdem",
  "jedoch",
  "zuerst",
  "danach",
  "schließlich",
  "einerseits",
  "andererseits",
  "folglich",
  "gleichwohl",
];

const FORMAL_MARKERS = [
  "sehr geehrte",
  "mit freundlichen grüßen",
  "hiermit",
  "ich bitte",
  "könnten sie",
  "würden sie",
  "im voraus",
];

const INFORMAL_MARKERS = ["hallo", "tschüss", "liebe grüße", "wie geht's", "mach's gut"];

const ACADEMIC_MARKERS = [
  "legen nahe",
  "im folgenden",
  "gleichwohl",
  "insofern",
  "darüber hinaus",
  "es sei",
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(text: string): number {
  const marks = text.match(/[.!?]/g)?.length ?? 0;
  const words = wordCount(text);
  if (marks >= 2) return marks;
  return words >= 12 ? 2 : words >= 6 ? 1 : 0;
}

function hitCount(text: string, needles: string[]): number {
  const hay = normalizeAnswer(text);
  return needles.filter((needle) => hay.includes(normalizeAnswer(needle))).length;
}

function nounCapitalization(text: string, keywords: string[]): number {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const expected = keywords
    .map((item) => item.replace(/^(der|die|das)\s+/i, "").trim())
    .filter((item) => /^[A-ZÄÖÜ]/.test(item));
  if (!expected.length) {
    const mid = tokens.filter((token, index) => index > 0 && /^[a-zäöü]/.test(token) === false);
    return Math.min(100, 50 + mid.length * 8);
  }
  let hits = 0;
  for (const noun of expected) {
    const re = new RegExp(`\\b${noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    const wrong = new RegExp(`\\b${noun.toLowerCase()}\\b`);
    if (re.test(text)) hits += 1;
    else if (wrong.test(text)) hits -= 0.5;
  }
  return Math.max(0, Math.min(100, Math.round((hits / expected.length) * 100)));
}

function registerScore(text: string, register?: WritingRegister): { score: number; note?: string } {
  if (!register) return { score: 70 };
  const hay = normalizeAnswer(text);
  if (register === "formal") {
    const good = hitCount(text, FORMAL_MARKERS);
    const bad = hitCount(text, ["tschüss", "hey", "lol"]);
    if (good >= 1 && bad === 0) return { score: 100 };
    if (bad > 0) return { score: 35, note: "Keep Sie and a formal close. Drop chatty closings." };
    return { score: 55, note: "Add a formal opening or Mit freundlichen Grüßen." };
  }
  if (register === "informal") {
    const good = hitCount(text, INFORMAL_MARKERS) + (hay.includes("du") || hay.includes("dir") ? 1 : 0);
    return { score: good ? 90 : 65 };
  }
  const good = hitCount(text, ACADEMIC_MARKERS);
  if (hay.includes("beweist") && !hay.includes("legen nahe")) {
    return { score: 45, note: "Hedge causal claims: legen nahe, not beweisen." };
  }
  return { score: good ? 90 : 60, note: good ? undefined : "Mark stance: im Folgenden, gleichwohl, legen nahe." };
}

export function writingTargets(level: "a1" | "a2" | "b1" | "b2" | "c1"): {
  minWords: number;
  targetWords: number;
} {
  switch (level) {
    case "a1":
      return { minWords: 12, targetWords: 24 };
    case "a2":
      return { minWords: 28, targetWords: 40 };
    case "b1":
      return { minWords: 70, targetWords: 90 };
    case "b2":
      return { minWords: 120, targetWords: 160 };
    default:
      return { minWords: 160, targetWords: 200 };
  }
}

export function scoreWriting(text: string, rubric: WritingRubric): RubricScores {
  const notes: string[] = [];
  const words = wordCount(text);
  const sentences = sentenceCount(text);
  const keywords = rubric.keywords ?? [];
  const connectors = rubric.connectors?.length ? rubric.connectors : CONNECTORS;

  const keywordHits = keywords.length ? hitCount(text, keywords) : Math.min(3, sentences);
  const keywordNeed = keywords.length ? Math.min(3, keywords.length) : 2;
  const lengthBand = rubric.targetWords
    ? Math.max(0, 100 - Math.abs(words - rubric.targetWords) * 2)
    : words >= rubric.minWords
      ? 90
      : Math.round((words / Math.max(1, rubric.minWords)) * 70);
  const content = Math.round(
    Math.min(100, (keywordHits / Math.max(1, keywordNeed)) * 55 + Math.min(45, lengthBand * 0.45)),
  );
  if (words < rubric.minWords) {
    notes.push(`Write at least ${rubric.minWords} words (you have ${words}).`);
  }
  if (keywords.length && keywordHits < keywordNeed) {
    notes.push(`Use more of the task language: ${keywords.slice(0, 4).join(", ")}.`);
  }

  const connectorHits = hitCount(text, connectors);
  const cohesion = Math.round(
    Math.min(100, sentences * 18 + connectorHits * 12 + (words >= rubric.minWords ? 20 : 0)),
  );
  if (sentences < 2) notes.push("Aim for at least two full sentences with . ! or ?");
  if (connectorHits === 0 && rubric.minWords >= 30) {
    notes.push("Link ideas with weil, dann, deshalb, or obwohl.");
  }

  const unique = new Set(normalizeAnswer(text).split(" ").filter((item) => item.length > 2));
  const vocabulary = Math.round(Math.min(100, unique.size * 4 + keywordHits * 8));

  const caps = nounCapitalization(text, [...keywords, ...(rubric.connectors ?? [])]);
  const register = registerScore(text, rubric.register);
  if (register.note) notes.push(register.note);
  const accuracy = Math.round(caps * 0.55 + register.score * 0.45);

  const overall = Math.round(content * 0.35 + cohesion * 0.2 + vocabulary * 0.2 + accuracy * 0.25);
  const floor = rubric.minWords <= 16 ? 0.65 : 0.7;
  const passed = overall >= 55 && words >= Math.max(8, Math.round(rubric.minWords * floor));

  if (passed && notes.length === 0) {
    notes.push("Task, length, and linking are on track. Compare with the model for polish.");
  }

  return {
    content,
    cohesion,
    vocabulary,
    accuracy,
    overall,
    passed,
    wordCount: words,
    notes: notes.slice(0, 4),
  };
}

export function rubricLabel(key: keyof Pick<RubricScores, "content" | "cohesion" | "vocabulary" | "accuracy">): string {
  switch (key) {
    case "content":
      return "Inhalt";
    case "cohesion":
      return "Aufbau";
    case "vocabulary":
      return "Wortschatz";
    case "accuracy":
      return "Korrektheit";
  }
}
