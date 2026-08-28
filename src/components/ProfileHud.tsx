"use client";

import Link from "next/link";
import { useApp } from "@/components/Providers";
import { streak } from "@/lib/progress";
import { levelProgress } from "@/lib/xp";

export function ProfileHud() {
  const { progress, ready } = useApp();
  const stats = levelProgress(progress.xp);
  const days = ready ? streak(progress.days) : 0;

  return (
    <Link
      href="/profile"
      className="flex min-w-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elev)_80%,transparent)] px-2.5 py-1.5 text-xs sm:gap-3 sm:px-3"
      aria-label={`Level ${stats.level}, ${stats.xpInLevel} of ${stats.xpToNext} XP to next level, ${days}-day streak`}
    >
      <span className="shrink-0 font-semibold tabular-nums">Lv {stats.level}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--line)] sm:w-20"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${stats.percent}%` }}
          />
        </span>
        <span className="hidden tabular-nums text-[10px] leading-none text-[var(--muted)] sm:block">
          {stats.xpInLevel}/{stats.xpToNext} XP
        </span>
      </span>
      <span className="shrink-0 tabular-nums text-[var(--muted)]">
        <span aria-hidden>🔥</span> {days}
      </span>
    </Link>
  );
}
