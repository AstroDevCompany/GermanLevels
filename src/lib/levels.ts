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
      "Sounds, café, phone, neighbour — then your first certificate tasks in four skills.",
    focus: ["Sounds", "Everyday talk", "First certificate tasks"],
  },
  a2: {
    id: "a2",
    name: "A2 · Waystage",
    nameDe: "A2 · Grundlage",
    stage: "Elementary",
    summary:
      "Shops, travel, health, pharmacy, appointments — the A2 paper plus conversations you can actually use.",
    focus: ["Daily situations", "Perfekt", "Notes, email, talk"],
  },
  b1: {
    id: "b1",
    name: "B1 · Threshold",
    nameDe: "B1 · Selbstständig",
    stage: "Intermediate",
    summary:
      "Share opinions, follow longer texts, and sit a B1-shaped paper: reading, listening, writing, speaking.",
    focus: ["Opinions", "Formal mail", "Mock exam"],
  },
  b2: {
    id: "b2",
    name: "B2 · Vantage",
    nameDe: "B2 · Fortgeschritten",
    stage: "Upper-intermediate",
    summary:
      "Argue with nuance, read editorials, and control passive and Konjunktiv II — B2 paper skills.",
    focus: ["Essays", "Listening twice", "Spoken stance"],
  },
  c1: {
    id: "c1",
    name: "C1 · Effective",
    nameDe: "C1 · Kompetent",
    stage: "Advanced",
    summary:
      "Move in academic and professional German with hedges, unpack Amtsdeutsch, and practise a C1-shaped paper.",
    focus: ["Register", "Abstracts", "Q&A"],
  },
};

export function isLevelId(value: string): value is LevelId {
  return LEVEL_ORDER.includes(value as LevelId);
}
