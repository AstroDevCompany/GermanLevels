import type {
  DialogueExercise,
  Exercise,
  LevelId,
  ListenComprehensionExercise,
  Phrase,
  Reading,
  SpeakResponseExercise,
  WritingPrompt,
  WritingRubric,
} from "@/content/types";
import { examPassageFor, examPassages } from "@/content/exam/passages";
import { conversationsFor } from "@/content/conversations";
import { looksGermanTask, pickDistractors, seededShuffle, uniqueWords } from "@/lib/german";
import { writingTargets } from "@/lib/writing-rubric";

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12);
}

function clip(text: string, max = 72): string {
  const clean = text.replace(/[.!?]$/, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function generatedReadingItems(reading: Reading, seed: string, count: number): Exercise[] {
  const sentences = splitSentences(reading.text);
  const items: Exercise[] = [];
  if (reading.titleDe) {
    items.push({
      type: "multiple-choice",
      id: makeId("rq-topic", 0),
      prompt: "What is the text mainly about?",
      promptDe: "Worüber spricht der Text hauptsächlich?",
      options: seededShuffle(
        uniqueWords([
          reading.titleDe,
          "Nur ein Fahrplan ohne Inhalt",
          "Ein Kochrezept aus dem 18. Jahrhundert",
          "Eine Werbeanzeige für ein Handy",
        ]),
        `${seed}-topic`,
      ).slice(0, 4),
      answer: reading.titleDe,
      explain: reading.titleDe,
      modality: "recognition",
      phase: "understand",
      errorCategory: "vocabulary",
    });
  }
  sentences.slice(0, Math.max(0, count)).forEach((sentence, i) => {
    if (items.length >= count) return;
    if (i % 2 === 0) {
      items.push({
        type: "true-false",
        id: makeId("rq-tf", i),
        prompt: "Is this what the text says?",
        promptDe: "Stimmt das so im Text?",
        statement: sentence,
        answer: true,
        explain: sentence,
        speak: sentence,
        modality: "recognition",
        phase: "understand",
      });
      return;
    }
    const answer = clip(sentence);
    const pool = sentences.filter((_, index) => index !== i).map((item) => clip(item));
    items.push({
      type: "multiple-choice",
      id: makeId("rq-mc", i),
      prompt: "Which line is in the text?",
      promptDe: "Was steht so im Text?",
      options: seededShuffle(
        uniqueWords([answer, ...pickDistractors(pool.length ? pool : ["Das steht nicht im Text."], answer, 3, `${seed}-mc-${i}`)]),
        `${seed}-mco-${i}`,
      ).slice(0, 4),
      answer,
      explain: sentence,
      modality: "recognition",
      phase: "understand",
      errorCategory: "vocabulary",
    });
  });
  return items.slice(0, count);
}

export function germanReadingItems(reading: Reading, seed: string, count = 4): Exercise[] {
  const fromBank = reading.questions
    .filter((item) => looksGermanTask(item.question))
    .slice(0, count)
    .map((item, i) => ({
      type: "multiple-choice" as const,
      id: makeId("rq-de", i),
      prompt: item.question,
      promptDe: item.question,
      options: item.options,
      answer: item.answer,
      explain: item.explain,
      modality: "recognition" as const,
      phase: "understand" as const,
      errorCategory: "vocabulary" as const,
    }));
  if (fromBank.length >= count) return fromBank;
  return [...fromBank, ...generatedReadingItems(reading, seed, count)].slice(0, count);
}

export function buildListeningScript(phrases: Phrase[], sentences: { de: string }[], maxChars = 420): string {
  const lines = [
    ...phrases.slice(0, 4).map((item) => item.de),
    ...sentences.slice(0, 3).map((item) => item.de),
  ].filter(Boolean);
  let out = "";
  for (const line of lines) {
    const next = out ? `${out} ${line}` : line;
    if (next.length > maxChars) break;
    out = next;
  }
  return out || phrases[0]?.de || sentences[0]?.de || "Guten Tag.";
}

function generatedListening(
  script: string,
  seed: string,
  count: number,
): ListenComprehensionExercise[] {
  const sentences = splitSentences(script);
  const stems = sentences.length ? sentences : [script];
  const prompts = [
    "Was wird am Anfang gesagt?",
    "Was kommt später im Text?",
    "Welche Aussage stimmt?",
    "Was hörst du gegen Ende?",
    "Was wird hier nicht gesagt?",
  ];
  return stems.slice(0, count).map((sentence, i) => {
    const answer = clip(sentence, 64);
    const pool = stems.filter((_, index) => index !== i).map((item) => clip(item, 64));
    const negative = i === 4;
    const chosen = negative ? "Das wird nicht gesagt." : answer;
    const options = seededShuffle(
      uniqueWords([
        chosen,
        ...pickDistractors(
          [...pool, "Nur auf Englisch.", "Das Gegenteil.", "Das wird nicht gesagt."],
          chosen,
          3,
          `${seed}-lh-${i}`,
        ),
      ]),
      `${seed}-lho-${i}`,
    ).slice(0, 4);
    return {
      type: "listen-comprehension" as const,
      id: makeId("lh-s", i),
      prompt: "Listen carefully. You can play it twice.",
      promptDe: "Hör genau zu. Du kannst zweimal abspielen.",
      speak: script,
      maxPlays: 2,
      question: prompts[i] ?? "Was wird gesagt?",
      options,
      answer: chosen,
      explain: sentence,
      modality: "recognition" as const,
      phase: "understand" as const,
    };
  });
}

export function connectedListening(
  script: string,
  reading: Reading | undefined,
  seed: string,
  count = 3,
): ListenComprehensionExercise[] {
  const questions: ListenComprehensionExercise[] = [];
  if (reading) {
    reading.questions
      .filter((item) => looksGermanTask(item.question))
      .slice(0, count)
      .forEach((item, i) => {
        questions.push({
          type: "listen-comprehension",
          id: makeId("lh", i),
          prompt: "Listen carefully. You can play it twice.",
          promptDe: "Hör genau zu. Du kannst zweimal abspielen.",
          speak: script,
          maxPlays: 2,
          question: item.question,
          options: item.options,
          answer: item.answer,
          explain: item.explain,
          modality: "recognition",
          phase: "understand",
          errorCategory: "vocabulary",
        });
      });
  }
  if (questions.length >= count) return questions.slice(0, count);
  return [...questions, ...generatedListening(script, seed, count)].slice(0, count);
}

export function speakingPrompt(
  writings: WritingPrompt[],
  phrases: Phrase[],
  seed: string,
): SpeakResponseExercise {
  const phrase = phrases[hashIndex(seed, phrases.length)] ?? phrases[0];
  const writing = writings[hashIndex(seed, Math.max(writings.length, 1))] ?? writings[0];
  const sample = phrase?.de ?? writing?.sample ?? "Guten Tag, ich hätte gern Hilfe.";
  return {
    type: "speak-response",
    id: "speak-1",
    prompt: writing?.prompt ?? "Answer in spoken German.",
    promptDe: writing?.promptDe ?? "Antworte laut auf Deutsch.",
    sample,
    speak: sample,
    keywords: (writing?.hints ?? sample.split(" ")).slice(0, 4),
    situation: "The other person is waiting. Answer in full sentences, not one word.",
    situationDe: "Jemand wartet. Antworte in ganzen Sätzen, nicht mit einem Wort.",
    minSeconds: 4,
    modality: "production",
    phase: "application",
    errorCategory: "other",
  };
}

export function dialogueFromPhrases(
  setting: string,
  settingDe: string,
  phrases: Phrase[],
  seed = "dialogue",
): DialogueExercise | null {
  if (phrases.length < 4) return null;
  const ordered = seededShuffle(phrases, `${seed}-dlg`).slice(0, 6);
  const turns = ordered.map((item, i) => ({
    speaker: i % 2 === 0 ? ("npc" as const) : ("you" as const),
    de: item.de,
    en: item.en,
    keywords: item.de.split(/\s+/).filter((word) => word.length > 3).slice(0, 3),
  }));
  if (turns[0]?.speaker !== "npc") {
    turns.unshift({ speaker: "npc", de: "Guten Tag!", en: "Good day!", keywords: ["Tag"] });
  }
  return {
    type: "dialogue",
    id: "dialogue-1",
    prompt: "Play the scene. Type or speak your lines.",
    promptDe: "Spiel die Szene. Tippe oder sprich deine Zeilen.",
    setting,
    settingDe,
    turns,
    modality: "production",
    phase: "application",
    errorCategory: "other",
  };
}

export function conversationDialogue(level: LevelId, seed: string): DialogueExercise | null {
  const list = conversationsFor(level);
  if (!list.length) return null;
  const mission = list[hashIndex(seed, list.length)] ?? list[0];
  return {
    type: "dialogue",
    id: `dialogue-${mission.id}`,
    prompt: mission.goal,
    promptDe: mission.goalDe,
    setting: mission.setting,
    settingDe: mission.settingDe,
    turns: mission.turns,
    modality: "production",
    phase: "application",
  };
}

export function longReading(level: LevelId, seed: string): Reading {
  return examPassageFor(level, seed);
}

export function extraReadings(level: LevelId): Reading[] {
  return examPassages(level);
}

function hashIndex(seed: string, length: number): number {
  if (length <= 0) return 0;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function registerFor(level: LevelId, chapterSlug: string): "informal" | "formal" | "academic" {
  if (level === "c1" || chapterSlug.includes("academic") || chapterSlug.includes("essay")) {
    return "academic";
  }
  if (level === "a1") return "informal";
  if (
    level === "b1" ||
    level === "b2" ||
    chapterSlug.includes("formal") ||
    chapterSlug.includes("work") ||
    chapterSlug.includes("business")
  ) {
    return "formal";
  }
  if (level === "a2") return "formal";
  return "informal";
}

export function rubricFor(level: LevelId, chapterSlug: string, writing?: WritingPrompt): WritingRubric {
  const targets = writingTargets(level);
  return {
    minWords: targets.minWords,
    targetWords: targets.targetWords,
    keywords: writing?.hints.slice(0, 4),
    register: registerFor(level, chapterSlug),
    connectors: level === "a1" ? ["und", "aber", "dann"] : undefined,
  };
}
