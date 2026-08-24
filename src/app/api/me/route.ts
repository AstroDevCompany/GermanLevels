import { NextResponse } from "next/server";
import {
  getSessionUser,
  loadAccount,
  upsertPreferences,
  upsertProgress,
} from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";
import { parsePreferences, parseProgress } from "@/lib/account-parse";

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const body = await request.json();
  if (body.prefs) {
    const prefs = parsePreferences(body.prefs);
    if (!prefs) {
      return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
    }
    await upsertPreferences(session.id, prefs);
  }
  if (body.progress) {
    const progress = parseProgress(body.progress);
    if (!progress) {
      return NextResponse.json({ error: "Invalid progress." }, { status: 400 });
    }
    await upsertProgress(session.id, progress);
  }
  if (body.completeOnboarding) {
    await ensureSchema();
    const db = sql();
    await db`UPDATE users SET onboarding_completed = true WHERE id = ${session.id}`;
    if (body.prefs) {
      const prefs = parsePreferences(body.prefs);
      if (prefs) await upsertPreferences(session.id, prefs);
    }
  }
  const account = await loadAccount(session.id);
  return NextResponse.json({
    ...account,
    needsOnboarding: !account.user.onboardingCompleted,
  });
}
