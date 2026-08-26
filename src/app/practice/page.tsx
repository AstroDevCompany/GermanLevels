"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { useApp } from "@/components/Providers";
import type { Lesson } from "@/content/types";
import { errorInsights } from "@/lib/errors";
import { targetedExercises } from "@/lib/targeted";

export default function PracticePage() {
  const { prefs, progress, ready } = useApp();
  const insights = useMemo(() => errorInsights(progress.errors ?? {}), [progress.errors]);
  const exercises = useMemo(() => targetedExercises(progress.errors ?? {}, 8), [progress.errors]);

  const lesson: Lesson | null = exercises.length
    ? {
        id: "targeted",
        number: 1,
        title: "Targeted practice",
        titleDe: "Gezielte Übung",
        skill: "mixed",
        role: "review",
        summary:
          "These items come from your error log — gender, grammar, spelling, word order, or forgotten words — not from a generic bank.",
        estimatedMinutes: 8,
        conceptIds: [],
        newVocab: [],
        recycledVocab: [],
        teaching: [
          {
            id: "why",
            kind: "grammar",
            eyebrow: "Review",
            phase: "review",
            title: insights[0]?.headline ?? "Practice what slipped",
            body: "A dedicated round for the patterns you miss. The same items can also appear inside later lessons.",
            points: insights.slice(0, 4).map((item) => `${item.headline} (${item.detail})`),
          },
        ],
        exercises,
      }
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Practice</h1>
      <p className="mt-3 text-[var(--muted)]">
        Targeted review from what you actually missed, plus the same items slipped into later
        lessons when you continue a course.
      </p>
      {!ready ? (
        <p className="mt-8 text-[var(--muted)]">Loading…</p>
      ) : lesson ? (
        <div className="mt-8">
          <LessonPlayer
            levelId={prefs.startingLevel}
            chapterSlug="practice"
            chapterTitle="Targeted practice"
            lesson={lesson}
            practice
          />
        </div>
      ) : (
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6">
          <p className="leading-7">
            No error log yet. Complete a few A1 lessons — especially recall and gap-fills — and
            this page will build drills from the patterns you miss, such as feminine articles or
            sein forms.
          </p>
          <Link href="/courses" className="mt-6 inline-block text-[var(--accent)]">
            Open full courses
          </Link>
        </section>
      )}
    </main>
  );
}
