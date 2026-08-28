"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/Providers";

export default function AccountPage() {
  const router = useRouter();
  const { user, signup, login, logout } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const action = mode === "signup" ? signup : login;
    const result = await action(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(result.needsOnboarding ? "/" : "/progress");
  }

  if (user) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">Account</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          Signed in as {user.email}. Lesson progress and personalization save to
          your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/profile" className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]">
            Profile
          </Link>
          <Link href="/settings" className="chip">
            Settings
          </Link>
          <Link href="/progress" className="chip">
            Progress
          </Link>
          <button
            type="button"
            className="rounded-full border border-[var(--danger)] px-5 py-2 text-sm"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">
        {mode === "signup" ? "Create an account" : "Log in"}
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Save progress across devices and keep your personalization with you.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className="chip"
          aria-pressed={mode === "login"}
          data-selected={mode === "login"}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={mode === "signup"}
          data-selected={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 font-normal"
          />
        </label>
        {mode === "signup" ? (
          <p className="text-sm text-[var(--muted)]">Use at least 8 characters.</p>
        ) : null}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
        >
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>
      </form>
    </main>
  );
}
