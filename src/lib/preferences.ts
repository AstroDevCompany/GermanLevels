"use client";

export type AccentId = "teal" | "amber" | "violet" | "rose" | "sky";

export type Preferences = {
  displayName: string;
  accent: AccentId;
  fontScale: 90 | 100 | 110 | 125;
  showHints: boolean;
  articleColors: boolean;
  reduceMotion: boolean;
  speechRate: number;
  dailyGoal: number;
  startingLevel: "a1" | "a2" | "b1" | "b2" | "c1";
};

export const DEFAULT_PREFERENCES: Preferences = {
  displayName: "",
  accent: "teal",
  fontScale: 100,
  showHints: true,
  articleColors: true,
  reduceMotion: false,
  speechRate: 0.92,
  dailyGoal: 20,
  startingLevel: "a1",
};

const KEY = "germanlevels.preferences.v1";

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  applyPreferences(prefs);
}

export function applyPreferences(prefs: Preferences) {
  const root = document.documentElement;
  root.dataset.accent = prefs.accent;
  root.dataset.articleColors = prefs.articleColors ? "on" : "off";
  root.dataset.reducedMotion = prefs.reduceMotion ? "on" : "off";
  root.style.setProperty("--font-scale", `${prefs.fontScale / 100}`);
}

export const ACCENTS: { id: AccentId; label: string }[] = [
  { id: "teal", label: "Teal" },
  { id: "amber", label: "Amber" },
  { id: "violet", label: "Violet" },
  { id: "rose", label: "Rose" },
  { id: "sky", label: "Sky" },
];
