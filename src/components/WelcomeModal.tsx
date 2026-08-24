"use client";

import { ACCENTS, type Preferences } from "@/lib/preferences";
import type { LevelId } from "@/content/types";

export function WelcomeModal({
  prefs,
  onChange,
  onFinish,
  saving,
}: {
  prefs: Preferences;
  onChange: (next: Preferences) => void;
  onFinish: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[color-mix(in_oklab,#000_45%,transparent)] p-4">
      <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
          Welcome
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          Set up your German path
        </h2>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          This stays with your account, so progress and these choices follow you
          on other devices.
        </p>

        <label className="mt-8 block text-sm font-medium">What should we call you?</label>
        <input
          value={prefs.displayName}
          onChange={(event) =>
            onChange({ ...prefs, displayName: event.target.value })
          }
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
          placeholder="Your name"
        />

        <p className="mt-6 text-sm font-medium">Starting level</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["a1", "a2", "b1", "b2", "c1"] as LevelId[]).map((level) => (
            <button
              key={level}
              type="button"
              className="chip uppercase"
              aria-pressed={prefs.startingLevel === level}
              data-selected={prefs.startingLevel === level}
              onClick={() => onChange({ ...prefs, startingLevel: level })}
            >
              {level}
            </button>
          ))}
        </div>

        <label className="mt-6 block text-sm font-medium">
          Daily lesson goal
        </label>
        <input
          type="number"
          min={5}
          max={40}
          value={prefs.dailyGoal}
          onChange={(event) =>
            onChange({ ...prefs, dailyGoal: Number(event.target.value) })
          }
          className="mt-2 w-32 rounded-2xl border border-[var(--line)] bg-transparent px-4 py-2"
        />

        <p className="mt-6 text-sm font-medium">Accent</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCENTS.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className="chip"
              aria-pressed={prefs.accent === accent.id}
              data-selected={prefs.accent === accent.id}
              onClick={() => onChange({ ...prefs, accent: accent.id })}
            >
              {accent.label}
            </button>
          ))}
        </div>

        <label className="mt-6 flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.showHints}
            onChange={(event) =>
              onChange({ ...prefs, showHints: event.target.checked })
            }
          />
          Show hints in lessons
        </label>
        <label className="mt-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.articleColors}
            onChange={(event) =>
              onChange({ ...prefs, articleColors: event.target.checked })
            }
          />
          Color-code der / die / das
        </label>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
            onClick={onFinish}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save and start"}
          </button>
        </div>
      </section>
    </div>
  );
}
