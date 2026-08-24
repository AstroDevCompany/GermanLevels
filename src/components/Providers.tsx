"use client";

import { ThemeProvider } from "next-themes";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "@/lib/preferences";
import {
  loadProgress,
  recordLesson,
  recordLessonProgress,
  resetProgress,
  toggleStar,
  type ProgressState,
} from "@/lib/progress";
import type { LevelId } from "@/content/types";

type AppContextValue = {
  ready: boolean;
  prefs: Preferences;
  setPrefs: (next: Preferences) => void;
  progress: ProgressState;
  completeLesson: (payload: {
    level: LevelId;
    chapter: string;
    lesson: string;
    score: number;
    total: number;
  }) => void;
  saveLessonProgress: (payload: {
    level: LevelId;
    chapter: string;
    lesson: string;
    percent: number;
  }) => void;
  starWord: (word: string) => void;
  clearProgress: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [progress, setProgress] = useState<ProgressState>({
    results: {},
    starred: [],
    xp: 0,
    days: {},
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadPreferences();
    setPrefsState(loaded);
    applyPreferences(loaded);
    setProgress(loadProgress());
    setReady(true);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      prefs,
      setPrefs: (next) => {
        setPrefsState(next);
        savePreferences(next);
      },
      progress,
      completeLesson: (payload) => {
        setProgress((current) => recordLesson(current, payload));
      },
      saveLessonProgress: (payload) => {
        setProgress((current) => recordLessonProgress(current, payload));
      },
      starWord: (word) => {
        setProgress((current) => toggleStar(current, word));
      },
      clearProgress: () => setProgress(resetProgress()),
    }),
    [prefs, progress, ready],
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ThemeProvider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
