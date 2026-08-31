"use client";

import Link from "next/link";
import { getLevels } from "@/content/index";
import { useApp } from "@/components/Providers";
import { UserGreeting } from "@/components/UserGreeting";
import { lessonKey, requiredLessons, streak } from "@/lib/progress";
import { levelProgress } from "@/lib/xp";
import { errorInsights, formatLastSeen, isResolved } from "@/lib/errors";
import { categoryLabel } from "@/lib/targeted";

export default function ProgressPage() {
  const { progress, ready, user } = useApp();
  const levels = getLevels();
  const stats = levelProgress(progress.xp);
  const days = ready ? streak(progress.days) : 0;
  const completed = Object.values(progress.results).filter((item) => item.completed).length;
  const insights = errorInsights(progress.errors ?? {});
  const allErrors = Object.values(progress.errors ?? {});
  const recentErrors = [
    ...allErrors.filter((item) => !isResolved(item)).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 6),
    ...allErrors.filter((item) => isResolved(item)).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 4),
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Progress</h1>
      <UserGreeting className="mt-2 text-[var(--accent)]" />
      <p className="mt-3 text-[var(--muted)]">
        {user
          ? `Saved to your account. ${ready ? `${completed} lesson${completed === 1 ? "" : "s"} done · level ${stats.level} · ${progress.xp} XP · ${days}-day streak.` : "Loading…"}`
          : `Saved on this device. ${ready ? `${completed} lesson${completed === 1 ? "" : "s"} done · level ${stats.level} · ${progress.xp} XP · ${days}-day streak.` : "Loading…"}`}{" "}
        <Link href="/profile" className="text-[var(--accent)]">
          Open profile
        </Link>
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {progress.lastLesson ? (
          <Link
            href={`/courses/${progress.lastLesson.level}/${progress.lastLesson.chapter}/${progress.lastLesson.lesson}`}
            className="inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          >
            Continue last lesson
          </Link>
        ) : null}
        <Link href="/exam" className="chip">
          Mock exams
        </Link>
        <Link href="/conversations" className="chip">
          Conversations
        </Link>
      </div>
      {ready && (insights.length || recentErrors.length) ? (
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-medium">What keeps slipping</h2>
            <Link href="/practice" className="text-sm text-[var(--accent)]">
              Open targeted practice
            </Link>
          </div>
          {insights.length ? (
            <ul className="mt-4 grid gap-3">
              {insights.map((item) => (
                <li key={`${item.kind}-${item.category}`} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <p className="font-medium">{item.headline}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
                  {item.targets.length ? (
                    <p className="mt-2 text-sm">{item.targets.join(" · ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {recentErrors.length ? (
            <ul className="mt-4 grid gap-2 text-sm">
              {recentErrors.map((item) => {
                const cleared = isResolved(item);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-3"
                  >
                    <span className={cleared ? "text-[var(--muted)] line-through" : undefined}>
                      <span className="capitalize">{item.errorKind.replace(/-/g, " ")}</span>
                      {" · "}
                      {categoryLabel(item.errorCategory)}
                      {" · "}
                      {item.target}
                      {!cleared && item.userAnswer ? ` ← ${item.userAnswer}` : ""}
                    </span>
                    <span className="text-[var(--muted)]">
                      {cleared
                        ? "cleared in review"
                        : `${item.confidence} confidence · ${item.attempts} attempts · ${formatLastSeen(item.lastSeen)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}
      <div className="mt-8 grid gap-4">
        {levels.map((level) => {
          const total = level.chapters.reduce(
            (sum, chapter) => sum + requiredLessons(chapter.lessons).length,
            0,
          );
          const done = level.chapters.reduce(
            (sum, chapter) =>
              sum +
              requiredLessons(chapter.lessons).filter(
                (lesson) =>
                  progress.results[lessonKey(level.id, chapter.slug, lesson.id)]?.completed,
              ).length,
            0,
          );
          return (
            <Link
              key={level.id}
              href={`/courses/${level.id}`}
              className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-medium">{level.name}</h2>
                <span className="text-sm text-[var(--muted)]">
                  {done}/{total}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[var(--line)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
