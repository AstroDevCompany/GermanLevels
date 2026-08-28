import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { ensureSchema, sql } from "@/lib/db";
import {
  DEFAULT_PREFERENCES,
  type Preferences,
} from "@/lib/preferences";
import { emptyProgress, type ProgressState } from "@/lib/progress";

export const SESSION_COOKIE = "gl_session";
const SESSION_DAYS = 30;

export type PublicUser = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
};

export type AccountPayload = {
  user: PublicUser;
  prefs: Preferences;
  progress: ProgressState;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  onboarding_completed: boolean;
};

type PrefRow = {
  display_name: string;
  accent: string;
  font_scale: number;
  show_hints: boolean;
  article_colors: boolean;
  reduce_motion: boolean;
  speech_rate: number;
  daily_goal: number;
  starting_level: string;
};

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function prefsFromRow(row?: PrefRow | null): Preferences {
  if (!row) return DEFAULT_PREFERENCES;
  return {
    displayName: row.display_name ?? "",
    accent: (row.accent as Preferences["accent"]) || DEFAULT_PREFERENCES.accent,
    fontScale:
      ([90, 100, 110, 125] as const).includes(
        row.font_scale as Preferences["fontScale"],
      )
        ? (row.font_scale as Preferences["fontScale"])
        : 100,
    showHints: row.show_hints,
    articleColors: row.article_colors,
    reduceMotion: row.reduce_motion,
    speechRate: (() => {
      const speed = Number(row.speech_rate);
      return Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_PREFERENCES.speechRate;
    })(),
    dailyGoal: row.daily_goal || 20,
    startingLevel:
      (row.starting_level as Preferences["startingLevel"]) || "a1",
  };
}

export function progressFromData(data: unknown): ProgressState {
  if (!data || typeof data !== "object") return emptyProgress();
  return { ...emptyProgress(), ...(data as ProgressState) };
}

export async function createSession(userId: string) {
  const db = sql();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db`INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 24 * 60 * 60));
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = sql();
    await db`DELETE FROM sessions WHERE token = ${token}`;
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<UserRow | null> {
  await ensureSchema();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = sql();
  const rows = await db`SELECT users.id, users.email, users.password_hash, users.onboarding_completed
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ${token} AND sessions.expires_at > now()
    LIMIT 1` as UserRow[];
  return rows[0] ?? null;
}

export async function loadAccount(userId: string): Promise<AccountPayload> {
  const db = sql();
  const users = await db`SELECT id, email, onboarding_completed FROM users WHERE id = ${userId} LIMIT 1` as {
    id: string;
    email: string;
    onboarding_completed: boolean;
  }[];
  const user = users[0];
  if (!user) throw new Error("User not found");
  const prefs = await db`SELECT * FROM user_preferences WHERE user_id = ${userId} LIMIT 1` as PrefRow[];
  const progress = await db`SELECT data FROM user_progress WHERE user_id = ${userId} LIMIT 1` as {
    data: unknown;
  }[];
  return {
    user: {
      id: user.id,
      email: user.email,
      onboardingCompleted: user.onboarding_completed,
    },
    prefs: prefsFromRow(prefs[0]),
    progress: progressFromData(progress[0]?.data),
  };
}

export async function upsertPreferences(userId: string, prefs: Preferences) {
  const db = sql();
  await db`INSERT INTO user_preferences (
      user_id, display_name, accent, font_scale, show_hints, article_colors,
      reduce_motion, speech_rate, daily_goal, starting_level, updated_at
    ) VALUES (
      ${userId}, ${prefs.displayName}, ${prefs.accent}, ${prefs.fontScale},
      ${prefs.showHints}, ${prefs.articleColors}, ${prefs.reduceMotion},
      ${prefs.speechRate}, ${prefs.dailyGoal}, ${prefs.startingLevel}, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      accent = EXCLUDED.accent,
      font_scale = EXCLUDED.font_scale,
      show_hints = EXCLUDED.show_hints,
      article_colors = EXCLUDED.article_colors,
      reduce_motion = EXCLUDED.reduce_motion,
      speech_rate = EXCLUDED.speech_rate,
      daily_goal = EXCLUDED.daily_goal,
      starting_level = EXCLUDED.starting_level,
      updated_at = now()`;
}

export async function upsertProgress(userId: string, progress: ProgressState) {
  const db = sql();
  const payload = JSON.stringify(progress);
  await db`INSERT INTO user_progress (user_id, data, updated_at)
    VALUES (${userId}, ${payload}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}

export function publicUser(row: { id: string; email: string; onboarding_completed: boolean }): PublicUser {
  return {
    id: row.id,
    email: row.email,
    onboardingCompleted: row.onboarding_completed,
  };
}
