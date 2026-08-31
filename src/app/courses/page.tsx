import Link from "next/link";
import type { Metadata } from "next";
import { getLevels } from "@/content/index";
import { requiredLessons } from "@/lib/progress";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  const levels = getLevels();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Courses</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Five paths, A1 to C1. A and B also train the conversations of daily life.
        Every level has a timed mock in four papers. A1 and A2 add extra listening
        scenes; A1 speaking sits in a separate optional lesson in each chapter.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {levels.map((level) => (
          <Link
            key={level.id}
            href={`/courses/${level.id}`}
            className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 transition hover:-translate-y-0.5"
          >
            <p className="text-sm text-[var(--muted)]">{level.stage}</p>
            <h2 className="mt-1 text-2xl font-semibold">{level.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{level.summary}</p>
            <p className="mt-4 text-sm">
              {level.chapters.length} chapters ·{" "}
              {requiredLessons(level.chapters[0]?.lessons ?? []).length} lessons each
              {level.chapters[0]?.lessons.some((lesson) => lesson.optional)
                ? " · optional speaking"
                : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
