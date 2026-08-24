"use client";

import Link from "next/link";
import { getLevels } from "@/content/index";
import { useApp } from "@/components/Providers";
import { UserGreeting } from "@/components/UserGreeting";
import { lessonKey, streak } from "@/lib/progress";

export default function ProgressPage() {
  const { progress, ready } = useApp();
  const levels = getLevels();
  const completed = Object.values(progress.results).filter((item) => item.completed).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Progress</h1>
      <UserGreeting className="mt-2 text-[var(--accent)]" />
      <p className="mt-3 text-[var(--muted)]">
        Saved on this device. {ready ? `${completed} lesson${completed === 1 ? "" : "s"} done · ${progress.xp} XP · ${streak(progress.days)}-day streak.` : "Loading…"}
      </p>
      {progress.lastLesson ? (
        <Link
          href={`/courses/${progress.lastLesson.level}/${progress.lastLesson.chapter}/${progress.lastLesson.lesson}`}
          className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
        >
          Continue last lesson
        </Link>
      ) : null}
      <div className="mt-8 grid gap-4">
        {levels.map((level) => {
          const total = level.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
          const done = level.chapters.reduce(
            (sum, chapter) =>
              sum +
              chapter.lessons.filter(
                (lesson) =>
                  progress.results[lessonKey(level.id, chapter.slug, lesson.id)]
                    ?.completed,
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
