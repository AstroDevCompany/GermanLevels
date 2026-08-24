import { NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  isValidEmail,
  loadAccount,
  normalizeEmail,
  upsertPreferences,
  upsertProgress,
} from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { parsePreferences, parseProgress } from "@/lib/account-parse";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";
import { emptyProgress } from "@/lib/progress";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    await ensureSchema();
    const db = sql();
    const existing = await db`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }
    const passwordHash = await hashPassword(password);
    const created = (await db`INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email, onboarding_completed`) as {
      id: string;
      email: string;
      onboarding_completed: boolean;
    }[];
    const user = created[0];
    const prefs = parsePreferences(body.prefs) ?? DEFAULT_PREFERENCES;
    const progress = parseProgress(body.progress) ?? emptyProgress();
    await upsertPreferences(user.id, prefs);
    await upsertProgress(user.id, progress);
    await createSession(user.id);
    const account = await loadAccount(user.id);
    return NextResponse.json({ ...account, needsOnboarding: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
  }
}
