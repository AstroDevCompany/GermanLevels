import { NextResponse } from "next/server";
import {
  createSession,
  isValidEmail,
  loadAccount,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { ensureSchema, sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");
    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Check your email and password." }, { status: 400 });
    }
    await ensureSchema();
    const db = sql();
    const rows = (await db`SELECT id, email, password_hash, onboarding_completed
      FROM users WHERE email = ${email} LIMIT 1`) as {
      id: string;
      email: string;
      password_hash: string;
      onboarding_completed: boolean;
    }[];
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }
    await db`DELETE FROM sessions WHERE user_id = ${user.id} AND expires_at < now()`;
    await createSession(user.id);
    const account = await loadAccount(user.id);
    return NextResponse.json({
      ...account,
      needsOnboarding: !account.user.onboardingCompleted,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
