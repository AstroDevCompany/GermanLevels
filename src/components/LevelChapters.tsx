"use client";

import Link from "next/link";
import type { Level } from "@/content/types";
import { isLessonStarted, lessonKey, lessonPercent } from "@/lib/progress";
import { ProgressMark } from "@/components/ProgressMark";
import { useApp } from "@/components/Providers";

export function LevelChapters({ level }: { level: Level }) {
  const { progress } = useApp();

  return (
    <div className="mt-10 grid gap-6">
      {level.chapters.map((chapter) => {
        const percents = chapter.lessons.map((lesson) =>
          lessonPercent(progress.results[lessonKey(level.id, chapter.slug, lesson.id)]),
        );
        const started = chapter.lessons.some((lesson) =>
          isLessonStarted(progress.results[lessonKey(level.id, chapter.slug, lesson.id)]),
        );
        const percent = percents.length
          ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
          : 0;
        return (
          <Link
            key={chapter.slug}
            href={`/courses/${level.id}/${chapter.slug}`}
            className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 transition hover:-translate-y-0.5"
          >
            <p className="text-sm text-[var(--muted)]">Chapter {chapter.number}</p>
            <p className="mt-2 text-sm capitalize text-[var(--muted)]">{chapter.skill}</p>
            <h2 className="mt-3 text-xl font-medium">{chapter.title}</h2>
            <p lang="de" className="mt-2 text-[var(--muted)]">
              {chapter.titleDe}
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-sm text-[var(--muted)]">{chapter.blurb}</p>
            <p className="mt-5 text-sm">{chapter.lessons.length} lessons</p>
            <ProgressMark percent={percent} started={started} />
          </Link>
        );
      })}
    </div>
  );
}
