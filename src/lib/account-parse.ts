import { emptyProgress, type ProgressState } from "@/lib/progress";
import {
  DEFAULT_PREFERENCES,
  type Preferences,
} from "@/lib/preferences";

export function isEmptyProgress(progress: ProgressState) {
  return (
    progress.xp === 0 &&
    progress.starred.length === 0 &&
    Object.keys(progress.results).length === 0 &&
    Object.keys(progress.errors ?? {}).length === 0
  );
}

export function parsePreferences(input: unknown): Preferences | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<Preferences>;
  const accent = ["teal", "amber", "violet", "rose", "sky"].includes(
    String(value.accent),
  )
    ? (value.accent as Preferences["accent"])
    : DEFAULT_PREFERENCES.accent;
  const fontScale = ([90, 100, 110, 125] as const).includes(
    value.fontScale as Preferences["fontScale"],
  )
    ? (value.fontScale as Preferences["fontScale"])
    : DEFAULT_PREFERENCES.fontScale;
  const startingLevel = ["a1", "a2", "b1", "b2", "c1"].includes(
    String(value.startingLevel),
  )
    ? (value.startingLevel as Preferences["startingLevel"])
    : DEFAULT_PREFERENCES.startingLevel;
  return {
    displayName: String(value.displayName ?? "").slice(0, 80),
    accent,
    fontScale,
    showHints: Boolean(value.showHints),
    articleColors: Boolean(value.articleColors),
    reduceMotion: Boolean(value.reduceMotion),
    speechRate: DEFAULT_PREFERENCES.speechRate,
    dailyGoal: Math.min(40, Math.max(5, Number(value.dailyGoal) || 20)),
    startingLevel,
  };
}

export function parseProgress(input: unknown): ProgressState | null {
  if (!input || typeof input !== "object") return null;
  const value = input as ProgressState;
  return {
    ...emptyProgress(),
    results: value.results && typeof value.results === "object" ? value.results : {},
    starred: Array.isArray(value.starred)
      ? value.starred.filter((item) => typeof item === "string")
      : [],
    xp: Number(value.xp) || 0,
    lastLesson: value.lastLesson,
    days: value.days && typeof value.days === "object" ? value.days : {},
    errors: value.errors && typeof value.errors === "object" ? value.errors : {},
  };
}
