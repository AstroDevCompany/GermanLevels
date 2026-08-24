"use client";

import { ThemeProvider } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WelcomeModal } from "@/components/WelcomeModal";
import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "@/lib/preferences";
import { isEmptyProgress } from "@/lib/account-parse";
import {
  emptyProgress,
  loadProgress,
  recordLesson,
  recordLessonProgress,
  resetProgress,
  saveProgress,
  toggleStar,
  type ProgressState,
} from "@/lib/progress";
import type { LevelId } from "@/content/types";

export type AuthUser = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
};

type AuthResult = { ok: true; needsOnboarding: boolean } | { ok: false; error: string };

type AppContextValue = {
  ready: boolean;
  user: AuthUser | null;
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
  signup: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

type AccountResponse = {
  user?: AuthUser | null;
  prefs?: Preferences;
  progress?: ProgressState;
  needsOnboarding?: boolean;
  error?: string;
};

async function readAccount(res: Response): Promise<AccountResponse> {
  try {
    return (await res.json()) as AccountResponse;
  } catch {
    return { error: "Something went wrong." };
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const userRef = useRef<AuthUser | null>(null);
  const saveTimer = useRef<number | null>(null);

  const applyAccount = useCallback((account: AccountResponse, localProgress: ProgressState) => {
    if (!account.user) {
      setUser(null);
      userRef.current = null;
      setShowOnboarding(false);
      return localProgress;
    }
    setUser(account.user);
    userRef.current = account.user;
    if (account.prefs) {
      setPrefsState(account.prefs);
      savePreferences(account.prefs);
    }
    const cloud = account.progress ?? emptyProgress();
    const next =
      isEmptyProgress(cloud) && !isEmptyProgress(localProgress) ? localProgress : cloud;
    setProgress(next);
    saveProgress(next);
    if (isEmptyProgress(cloud) && !isEmptyProgress(localProgress)) {
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: next }),
      });
    }
    setShowOnboarding(Boolean(account.needsOnboarding));
    return next;
  }, []);

  const queueCloudProgress = useCallback((next: ProgressState) => {
    if (!userRef.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: next }),
      });
    }, 700);
  }, []);

  useEffect(() => {
    const loadedPrefs = loadPreferences();
    const loadedProgress = loadProgress();
    setPrefsState(loadedPrefs);
    applyPreferences(loadedPrefs);
    setProgress(loadedProgress);
    void fetch("/api/auth/me")
      .then(readAccount)
      .then((account) => {
        applyAccount(account, loadedProgress);
      })
      .finally(() => setReady(true));
  }, [applyAccount]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      prefs,
      setPrefs: (next) => {
        setPrefsState(next);
        savePreferences(next);
        if (userRef.current) {
          void fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefs: next }),
          });
        }
      },
      progress,
      completeLesson: (payload) => {
        setProgress((current) => {
          const next = recordLesson(current, payload);
          queueCloudProgress(next);
          return next;
        });
      },
      saveLessonProgress: (payload) => {
        setProgress((current) => {
          const next = recordLessonProgress(current, payload);
          queueCloudProgress(next);
          return next;
        });
      },
      starWord: (word) => {
        setProgress((current) => {
          const next = toggleStar(current, word);
          queueCloudProgress(next);
          return next;
        });
      },
      clearProgress: () => {
        const next = resetProgress();
        setProgress(next);
        queueCloudProgress(next);
      },
      signup: async (email, password) => {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, prefs, progress }),
        });
        const account = await readAccount(res);
        if (!res.ok || !account.user) {
          return { ok: false, error: account.error ?? "Could not create the account." };
        }
        applyAccount({ ...account, needsOnboarding: true }, progress);
        return { ok: true, needsOnboarding: true };
      },
      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const account = await readAccount(res);
        if (!res.ok || !account.user) {
          return { ok: false, error: account.error ?? "Could not sign in." };
        }
        applyAccount(account, loadProgress());
        return { ok: true, needsOnboarding: Boolean(account.needsOnboarding) };
      },
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        userRef.current = null;
        setShowOnboarding(false);
      },
    }),
    [applyAccount, prefs, progress, queueCloudProgress, ready, user],
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContext.Provider value={value}>
        {children}
        {showOnboarding ? (
          <WelcomeModal
            prefs={prefs}
            saving={savingOnboarding}
            onChange={(next) => {
              setPrefsState(next);
              savePreferences(next);
              applyPreferences(next);
            }}
            onFinish={async () => {
              setSavingOnboarding(true);
              await fetch("/api/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefs, completeOnboarding: true }),
              });
              setUser((current) =>
                current ? { ...current, onboardingCompleted: true } : current,
              );
              setShowOnboarding(false);
              setSavingOnboarding(false);
            }}
          />
        ) : null}
      </AppContext.Provider>
    </ThemeProvider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}
