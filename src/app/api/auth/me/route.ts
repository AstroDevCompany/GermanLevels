import { NextResponse } from "next/server";
import { getSessionUser, loadAccount } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const account = await loadAccount(session.id);
  return NextResponse.json({
    ...account,
    needsOnboarding: !account.user.onboardingCompleted,
  });
}
