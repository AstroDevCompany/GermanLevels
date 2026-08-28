import type { LevelId } from "@/content/types";

export const LEVEL_ORDER: LevelId[] = ["a1", "a2", "b1", "b2", "c1"];

export const LEVEL_META: Record<
  LevelId,
  {
    id: LevelId;
    name: string;
    nameDe: string;
    stage: string;
    summary: string;
    focus: string[];
  }
> = {
  a1: {
    id: "a1",
    name: "A1 · Breakthrough",
    nameDe: "A1 · Einstieg",
    stage: "Beginner",
    summary:
      "Start with sounds and a wide beginner word stock, then write your first German sentences.",
    focus: ["Alphabet & reading", "Broad vocabulary", "First writing"],
  },
  a2: {
    id: "a2",
    name: "A2 · Waystage",
    nameDe: "A2 · Grundlage",
    stage: "Elementary",
    summary:
      "Handle everyday life and add the rest of a 2000-word beginner stock: shopping, travel, health, and short messages in the past.",
    focus: ["Daily situations", "Perfekt", "Notes & emails"],
  },
  b1: {
    id: "b1",
    name: "B1 · Threshold",
    nameDe: "B1 · Selbstständig",
    stage: "Intermediate",
    summary:
      "Share opinions, follow longer texts, and write clear connected German.",
    focus: ["Opinions", "Subclauses", "Formal writing"],
  },
  b2: {
    id: "b2",
    name: "B2 · Vantage",
    nameDe: "B2 · Fortgeschritten",
    stage: "Upper-intermediate",
    summary:
      "Argue with nuance, read editorials, and control passive, Konjunktiv II, and style.",
    focus: ["Nuance", "Essays", "Idioms"],
  },
  c1: {
    id: "c1",
    name: "C1 · Effective",
    nameDe: "C1 · Kompetent",
    stage: "Advanced",
    summary:
      "Move in academic, professional, and literary German with control and precision.",
    focus: ["Register", "Academic writing", "Rhetoric"],
  },
};

export function isLevelId(value: string): value is LevelId {
  return LEVEL_ORDER.includes(value as LevelId);
}
