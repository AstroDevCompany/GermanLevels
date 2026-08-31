import type { LevelId } from "@/content/types";
import { applyAnswer, type AnswerPayload, type ErrorRecord } from "@/lib/errors";
import { lessonXp, pendingStreakBonus } from "@/lib/xp";

export type LessonResult = {
  completed: boolean;
  started?: boolean;
  percent?: number;
  score: number;
  total: number;
  at: number;
};

export type LastXpGain = {
  lesson: number;
  streak: number;
};

export type ProgressState = {
  results: Record<string, LessonResult>;
  starred: string[];
  xp: number;
  lastLesson?: {
    level: LevelId;
    chapter: string;
    lesson: string;
  };
  days: Record<string, number>;
  errors: Record<string, ErrorRecord>;
  streakRewardWeeks: number;
  bestStreak: number;
  lastXp?: LastXpGain;
};

const KEY = "germanlevels.progress.v1";

export function emptyProgress(): ProgressState {
  return {
    results: {},
    starred: [],
    xp: 0,
    days: {},
    errors: {},
    streakRewardWeeks: 0,
    bestStreak: 0,
  };
}

export function lessonKey(level: string, chapter: string, lesson: string) {
  return `${level}/${chapter}/${lesson}`;
}

export function todayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromProgressData(input: unknown): ProgressState {
  if (!input || typeof input !== "object") return emptyProgress();
  const value = input as Partial<ProgressState> & Record<string, unknown>;
  const days =
    value.days && typeof value.days === "object" && !Array.isArray(value.days)
      ? (value.days as Record<string, number>)
      : {};
  const streakDays = streak(days);
  const hasClaimed = Object.prototype.hasOwnProperty.call(value, "streakRewardWeeks");
  return {
    results:
      value.results && typeof value.results === "object" ? value.results : {},
    starred: Array.isArray(value.starred)
      ? value.starred.filter((item) => typeof item === "string")
      : [],
    xp: Math.max(0, Number(value.xp) || 0),
    lastLesson: value.lastLesson,
    days,
    errors: value.errors && typeof value.errors === "object" ? value.errors : {},
    streakRewardWeeks: hasClaimed
      ? Math.max(0, Number(value.streakRewardWeeks) || 0)
      : Math.floor(streakDays / 7),
    bestStreak: Math.max(Number(value.bestStreak) || 0, streakDays),
    lastXp: value.lastXp,
  };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return emptyProgress();
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return fromProgressData(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function recordLesson(
  state: ProgressState,
  payload: {
    level: LevelId;
    chapter: string;
    lesson: string;
    score: number;
    total: number;
  },
  now = new Date(),
): ProgressState {
  const key = lessonKey(payload.level, payload.chapter, payload.lesson);
  const previous = state.results[key];
  const gained = lessonXp(payload.score, Boolean(previous?.completed));
  const day = todayKey(now);
  const days = {
    ...state.days,
    [day]: (state.days[day] ?? 0) + 1,
  };
  const streakDays = streak(days, now);
  const bonus = pendingStreakBonus(streakDays, state.streakRewardWeeks ?? 0);
  const next: ProgressState = {
    ...state,
    results: {
      ...state.results,
      [key]: {
        completed: true,
        started: true,
        percent: 100,
        score: payload.score,
        total: payload.total,
        at: now.getTime(),
      },
    },
    xp: state.xp + gained + bonus.xp,
    lastLesson: {
      level: payload.level,
      chapter: payload.chapter,
      lesson: payload.lesson,
    },
    days,
    streakRewardWeeks: bonus.earnedWeeks,
    bestStreak: Math.max(state.bestStreak ?? 0, streakDays),
    lastXp: { lesson: gained, streak: bonus.xp },
  };
  saveProgress(next);
  return next;
}

export function recordLessonProgress(
  state: ProgressState,
  payload: {
    level: LevelId;
    chapter: string;
    lesson: string;
    percent: number;
  },
): ProgressState {
  const key = lessonKey(payload.level, payload.chapter, payload.lesson);
  const previous = state.results[key];
  if (previous?.completed) return state;
  const percent = Math.max(previous?.percent ?? 0, Math.min(99, Math.max(0, payload.percent)));
  const next: ProgressState = {
    ...state,
    results: {
      ...state.results,
      [key]: {
        completed: false,
        started: true,
        percent,
        score: previous?.score ?? 0,
        total: previous?.total ?? 0,
        at: Date.now(),
      },
    },
    lastLesson: {
      level: payload.level,
      chapter: payload.chapter,
      lesson: payload.lesson,
    },
  };
  saveProgress(next);
  return next;
}

export function lessonPercent(result?: LessonResult): number {
  if (!result) return 0;
  if (result.completed) return 100;
  return Math.min(99, Math.max(0, result.percent ?? 0));
}

export function isLessonStarted(result?: LessonResult): boolean {
  return Boolean(result?.started || result?.completed || (result?.percent ?? 0) > 0);
}

export function requiredLessons<T extends { optional?: boolean }>(lessons: T[]): T[] {
  return lessons.filter((lesson) => !lesson.optional);
}

export function progressTone(percent: number): "orange" | "yellow" | "green" | "blue" {
  if (percent >= 100) return "blue";
  if (percent > 75) return "green";
  if (percent >= 25) return "yellow";
  return "orange";
}

export function recordAnswer(state: ProgressState, payload: AnswerPayload): ProgressState {
  const next: ProgressState = {
    ...state,
    errors: applyAnswer(state.errors ?? {}, payload),
  };
  saveProgress(next);
  return next;
}

export function toggleStar(state: ProgressState, word: string): ProgressState {
  const exists = state.starred.includes(word);
  const next = {
    ...state,
    starred: exists
      ? state.starred.filter((item) => item !== word)
      : [...state.starred, word],
  };
  saveProgress(next);
  return next;
}

export function resetProgress(): ProgressState {
  const empty = emptyProgress();
  saveProgress(empty);
  return empty;
}

export function streak(days: Record<string, number>, now = new Date()): number {
  let count = 0;
  for (let i = 0; i < 40000; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = todayKey(date);
    if (days[key]) count += 1;
    else if (i > 0) break;
  }
  return count;
}
