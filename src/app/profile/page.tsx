"use client";

import Link from "next/link";
import { useApp } from "@/components/Providers";
import { UserGreeting } from "@/components/UserGreeting";
import { streak, todayKey } from "@/lib/progress";
import {
  BASE_LESSON_XP,
  nextTrophy,
  pendingStreakBonus,
  TROPHY_LEVELS,
  TROPHY_META,
  WEEKLY_STREAK_LESSONS,
  weeklyStreakBonus,
  weeklyStreakMultiplier,
  levelProgress,
} from "@/lib/xp";

export default function ProfilePage() {
  const { progress, ready, user } = useApp();
  const stats = levelProgress(progress.xp);
  const days = ready ? streak(progress.days) : 0;
  const best = Math.max(progress.bestStreak ?? 0, days);
  const next = nextTrophy(stats.level);
  const keptToday = Boolean(progress.days[todayKey()]);
  const nextWeek = Math.floor(days / 7) + 1;
  const daysToBonus = nextWeek * 7 - days;
  const nextBonusXp = weeklyStreakBonus(nextWeek);
  const nextBonusPct = Math.round(weeklyStreakMultiplier(nextWeek) * 100);
  const pending = pendingStreakBonus(days, progress.streakRewardWeeks ?? 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
        {user ? "Account" : "This device"}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Profile</h1>
      <UserGreeting className="mt-2 text-[var(--accent)]" />
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        {user
          ? "XP, levels, trophies, and your streak save with this account."
          : "XP, levels, trophies, and your streak stay on this device until you create an account."}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <p className="text-sm text-[var(--muted)]">Level</p>
          <p className="mt-2 text-4xl font-semibold tabular-nums">{stats.level}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {stats.totalXp} XP total
          </p>
        </article>
        <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5 sm:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--muted)]">Progress to level {stats.level + 1}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {stats.xpInLevel}
                <span className="text-base font-normal text-[var(--muted)]">
                  {" "}
                  / {stats.xpToNext} XP
                </span>
              </p>
            </div>
            <p className="text-sm tabular-nums text-[var(--muted)]">
              {Math.round(stats.percent)}%
            </p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--line)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Each level needs more XP than the last. Lessons grant XP; a weekly streak adds a bonus.
          </p>
        </article>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--muted)]">Daily streak</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">
              {days}
              <span className="text-lg font-normal text-[var(--muted)]">
                {" "}
                {days === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">Best {best}</p>
        </div>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Finish at least one lesson each day. Miss a day and the streak returns to zero.
          {keptToday
            ? " Today is already counted."
            : " You still need a lesson today to keep it."}
        </p>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
          Every 7 days you earn XP equal to 10 lessons
          ({BASE_LESSON_XP * WEEKLY_STREAK_LESSONS} XP at week one). Longer streaks pay more: 7 days = 100%, 14 days = 120%, and so on.
          {days > 0
            ? ` Next weekly bonus in ${daysToBonus} day${daysToBonus === 1 ? "" : "s"}: +${nextBonusXp} XP (${nextBonusPct}%).`
            : ` Complete seven days in a row for +${weeklyStreakBonus(1)} XP.`}
          {pending.xp ? ` A bonus of +${pending.xp} XP is waiting on your next lesson.` : ""}
        </p>
        <Link href="/courses" className="mt-5 inline-flex text-sm text-[var(--accent)]">
          Open a lesson
        </Link>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Trophies</h2>
          {next ? (
            <p className="text-sm text-[var(--muted)]">Next at level {next}</p>
          ) : (
            <p className="text-sm text-[var(--muted)]">Every trophy is yours.</p>
          )}
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TROPHY_LEVELS.map((level) => {
            const meta = TROPHY_META[level];
            const unlocked = stats.level >= level;
            return (
              <li
                key={level}
                className={`rounded-3xl border px-5 py-5 ${
                  unlocked
                    ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,var(--bg-elev))]"
                    : "border-[var(--line)] bg-[var(--bg-elev)] opacity-70"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Level {level}
                </p>
                <p className="mt-2 font-medium">{meta.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{meta.detail}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {unlocked ? "Unlocked" : `Reach level ${level}`}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
