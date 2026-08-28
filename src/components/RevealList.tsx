"use client";

import { useState } from "react";
import { SpeakButton } from "@/components/SpeakButton";
import { articleClass } from "@/lib/german";

export type RevealRow = {
  de: string;
  en: string;
  note?: string;
};

export function RevealList({
  rows,
  prompt = "de",
  starred,
  onStar,
  compact = false,
}: {
  rows: RevealRow[];
  prompt?: "de" | "en";
  starred?: string[];
  onStar?: (word: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const allOpen = rows.length > 0 && open.size === rows.length;
  const allLabel = prompt === "de" ? "meanings" : "German";
  const oneLabel = prompt === "de" ? "meaning" : "German";

  function toggle(index: number) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(rows.map((_, index) => index)));
  }

  return (
    <div className={compact ? "mt-3" : "mt-6"}>
      {compact ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            {prompt === "de"
              ? "Tap a line to see the meaning. Tap again to hide it."
              : "Say the German, then tap to check."}
          </p>
          {rows.length > 1 ? (
            <button type="button" className="chip" onClick={toggleAll}>
              {allOpen ? `Hide all ${allLabel}` : `Show all ${allLabel}`}
            </button>
          ) : null}
        </div>
      )}
      <ul className={compact ? "grid gap-2" : "mt-4 grid gap-4"}>
        {rows.map((row, index) => {
          const shown = prompt === "de" ? row.de : row.en;
          const hidden = prompt === "de" ? row.en : row.de;
          const revealed = open.has(index);
          return (
            <li
              key={`${row.de}-${index}`}
              className={
                compact
                  ? "rounded-xl border border-[var(--line)] px-3 py-2"
                  : "rounded-2xl border border-[var(--line)] px-4 py-4"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => toggle(index)}
                  aria-expanded={revealed}
                >
                  <p className={`font-medium ${prompt === "de" ? articleClass(row.de) : ""}`}>
                    {shown}
                  </p>
                  {revealed ? (
                    <>
                      <p
                        className={`mt-2 text-sm ${
                          prompt === "en" ? articleClass(row.de) : "text-[var(--muted)]"
                        }`}
                      >
                        {hidden}
                      </p>
                      {row.note ? (
                        <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{row.note}</p>
                      ) : null}
                    </>
                  ) : compact ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">···</p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)]">Tap to show {oneLabel}</p>
                  )}
                </button>
                <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
                  <SpeakButton text={row.de} />
                  {onStar ? (
                    <button
                      type="button"
                      className="chip"
                      onClick={() => onStar(row.de)}
                      aria-label="Star word"
                    >
                      {starred?.includes(row.de) ? "★" : "☆"}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
