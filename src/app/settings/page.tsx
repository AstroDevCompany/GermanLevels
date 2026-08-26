"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { ACCENTS } from "@/lib/preferences";
import { useApp } from "@/components/Providers";
import type { LevelId } from "@/content/types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const activeTheme = theme ?? "system";
  const { prefs, setPrefs, clearProgress, user, logout } = useApp();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-3 text-[var(--muted)]">
        Theme follows your system unless you lock it.
        {user
          ? " Personalization and lesson progress save to your account."
          : " Other choices stay on this device until you create an account."}
      </p>
      {user ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Signed in as {user.email}.{" "}
          <button type="button" className="text-[var(--accent)]" onClick={() => void logout()}>
            Log out
          </button>
        </p>
      ) : (
        <p className="mt-4 text-sm">
          <Link href="/account" className="text-[var(--accent)]">
            Log in or create an account
          </Link>{" "}
          to keep progress on every device.
        </p>
      )}

      <label className="mt-8 block text-sm font-medium">Display name</label>
      <input
        value={prefs.displayName}
        onChange={(event) => setPrefs({ ...prefs, displayName: event.target.value })}
        className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
        placeholder="Optional"
      />

      <p className="mt-8 text-sm font-medium">Theme</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["system", "light", "dark"].map((value) => (
          <button
            key={value}
            type="button"
            className="chip capitalize"
            aria-pressed={activeTheme === value}
            data-selected={activeTheme === value}
            onClick={() => setTheme(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <p className="mt-8 text-sm font-medium">Accent</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ACCENTS.map((accent) => (
          <button
            key={accent.id}
            type="button"
            className="chip"
            aria-pressed={prefs.accent === accent.id}
            data-selected={prefs.accent === accent.id}
            onClick={() => setPrefs({ ...prefs, accent: accent.id })}
          >
            {accent.label}
          </button>
        ))}
      </div>

      <p className="mt-8 text-sm font-medium">Reading size</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {([90, 100, 110, 125] as const).map((size) => (
          <button
            key={size}
            type="button"
            className="chip"
            aria-pressed={prefs.fontScale === size}
            data-selected={prefs.fontScale === size}
            onClick={() => setPrefs({ ...prefs, fontScale: size })}
          >
            {size}%
          </button>
        ))}
      </div>

      <p className="mt-8 text-sm font-medium">Starting level for practice</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(["a1", "a2", "b1", "b2", "c1"] as LevelId[]).map((level) => (
          <button
            key={level}
            type="button"
            className="chip uppercase"
            aria-pressed={prefs.startingLevel === level}
            data-selected={prefs.startingLevel === level}
            onClick={() => setPrefs({ ...prefs, startingLevel: level })}
          >
            {level}
          </button>
        ))}
      </div>

      <label className="mt-8 flex items-center gap-3">
        <input
          type="checkbox"
          checked={prefs.showHints}
          onChange={(event) => setPrefs({ ...prefs, showHints: event.target.checked })}
        />
        Show hints in lessons (letter-by-letter on typing)
      </label>
      <label className="mt-3 flex items-center gap-3">
        <input
          type="checkbox"
          checked={prefs.articleColors}
          onChange={(event) =>
            setPrefs({ ...prefs, articleColors: event.target.checked })
          }
        />
        Color-code der / die / das
      </label>
      <label className="mt-3 flex items-center gap-3">
        <input
          type="checkbox"
          checked={prefs.reduceMotion}
          onChange={(event) =>
            setPrefs({ ...prefs, reduceMotion: event.target.checked })
          }
        />
        Reduce motion
      </label>

      <label className="mt-8 block text-sm font-medium">Daily lesson goal</label>
      <input
        type="number"
        min={5}
        max={40}
        value={prefs.dailyGoal}
        onChange={(event) =>
          setPrefs({ ...prefs, dailyGoal: Number(event.target.value) })
        }
        className="mt-2 block w-32 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-2"
      />

      <button
        type="button"
        className="mt-10 block rounded-full border border-[var(--danger)] px-5 py-2 text-sm"
        onClick={() => {
          if (confirm(user ? "Reset all lesson progress in your account?" : "Reset all lesson progress on this device?")) clearProgress();
        }}
      >
        Reset progress
      </button>
    </main>
  );
}
