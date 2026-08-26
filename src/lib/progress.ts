import type { LevelId } from "@/content/types";
import { applyAnswer, type AnswerPayload, type ErrorRecord } from "@/lib/errors";

export type LessonResult = {
  completed: boolean;
  started?: boolean;
  percent?: number;
  score: number;
  total: number;
  at: number;
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
};

const KEY = "germanlevels.progress.v1";

export function emptyProgress(): ProgressState {
  return { results: {}, starred: [], xp: 0, days: {}, errors: {} };
}

export function lessonKey(level: string, chapter: string, lesson: string) {
  return `${level}/${chapter}/${lesson}`;
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return emptyProgress();
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
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
): ProgressState {
  const key = lessonKey(payload.level, payload.chapter, payload.lesson);
  const previous = state.results[key];
  const gained = previous?.completed ? 8 : 20 + payload.score * 2;
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
        at: Date.now(),
      },
    },
    xp: state.xp + gained,
    lastLesson: {
      level: payload.level,
      chapter: payload.chapter,
      lesson: payload.lesson,
    },
    days: {
      ...state.days,
      [todayKey()]: (state.days[todayKey()] ?? 0) + 1,
    },
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

export function streak(days: Record<string, number>): number {
  let count = 0;
  const now = new Date();
  for (let i = 0; i < 60; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    if (days[key]) count += 1;
    else if (i > 0) break;
  }
  return count;
}
