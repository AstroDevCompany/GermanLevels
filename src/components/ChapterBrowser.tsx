"use client";

import Link from "next/link";
import { useState } from "react";
import type { Chapter, LevelId } from "@/content/types";
import { articleClass } from "@/lib/german";
import { isLessonStarted, lessonKey, lessonPercent } from "@/lib/progress";
import { ProgressMark } from "@/components/ProgressMark";
import { useApp } from "@/components/Providers";

type Neighbor = { slug: string; title: string } | null;

export function ChapterBrowser({
  levelId,
  chapter,
  prev,
  next,
}: {
  levelId: LevelId;
  chapter: Chapter;
  prev: Neighbor;
  next: Neighbor;
}) {
  const { progress } = useApp();
  const [tab, setTab] = useState<"lessons" | "words">("lessons");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Link href={`/courses/${levelId}`} className="text-sm text-[var(--accent)]">
        Back to {levelId.toUpperCase()}
      </Link>
      <p className="mt-6 text-sm text-[var(--muted)]">Chapter {chapter.number}</p>
      <p className="mt-2 text-sm capitalize text-[var(--muted)]">{chapter.skill}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{chapter.title}</h1>
      <p className="mt-2 text-lg text-[var(--muted)]">{chapter.titleDe}</p>
      <p className="mt-5 max-w-2xl leading-8">{chapter.blurb}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        {(["lessons", "words"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip capitalize ${tab === id ? "border-[var(--accent)]" : ""}`}
            onClick={() => setTab(id)}
          >
            {id === "lessons" ? "Lessons" : "Chapter words"}
          </button>
        ))}
      </div>

      {tab === "lessons" ? (
        <section className="mt-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {chapter.lessons.map((lesson) => {
              const result = progress.results[lessonKey(levelId, chapter.slug, lesson.id)];
              const percent = lessonPercent(result);
              const started = isLessonStarted(result);
              return (
                <Link
                  key={lesson.id}
                  href={`/courses/${levelId}/${chapter.slug}/${lesson.id}`}
                  className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6"
                >
                  <p className="text-xs text-[var(--muted)]">
                    Lesson {String(lesson.number).padStart(2, "0")}
                  </p>
                  <p className="mt-2 capitalize text-sm text-[var(--muted)]">{lesson.skill}</p>
                  <p className="mt-3 font-medium">{lesson.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{lesson.titleDe}</p>
                  <p className="mt-4 text-sm text-[var(--muted)]">{lesson.estimatedMinutes} min</p>
                  <ProgressMark percent={percent} started={started} />
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="mt-8">
          {chapter.grammar.length ? (
            <div className="mb-8 grid gap-3">
              {chapter.grammar.map((point) => (
                <p key={point} className="rounded-2xl border border-[var(--line)] px-4 py-3 leading-7">
                  {point}
                </p>
              ))}
            </div>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2">
            {chapter.vocab.map((item, index) => (
              <li
                key={`${item.de}-${index}`}
                className="rounded-2xl border border-[var(--line)] px-4 py-4"
              >
                <p className={`font-medium ${articleClass(item.de)}`}>{item.de}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.en}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-between">
        {prev ? (
          <Link
            href={`/courses/${levelId}/${prev.slug}`}
            className="rounded-2xl border border-[var(--line)] px-5 py-4"
          >
            Previous chapter
            <span className="mt-2 block text-sm text-[var(--muted)]">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/courses/${levelId}/${next.slug}`}
            className="rounded-2xl border border-[var(--line)] px-5 py-4 sm:text-right"
          >
            Next chapter
            <span className="mt-2 block text-sm text-[var(--muted)]">{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
