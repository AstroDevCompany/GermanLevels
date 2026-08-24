"use client";

import { progressTone } from "@/lib/progress";

export function ProgressMark({
  percent,
  started,
}: {
  percent: number;
  started: boolean;
}) {
  if (!started && percent <= 0) return null;
  const tone = progressTone(percent);
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs text-[var(--muted)]">
        <span>Progress</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className={`h-full rounded-full progress-fill progress-${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
