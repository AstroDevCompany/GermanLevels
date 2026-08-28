"use client";

import { useEffect, useState } from "react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { examSectionMeta, type ExamSectionId } from "@/content/exam/papers";
import type { Lesson, LevelId } from "@/content/types";

export function ExamSectionPlayer({
  levelId,
  section,
  lesson,
  nextHref,
}: {
  levelId: LevelId;
  section: ExamSectionId;
  lesson: Lesson;
  nextHref?: string;
}) {
  const minutes = examSectionMeta(levelId, section).minutes;
  const [left, setLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setLeft(minutes * 60);
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value === null) return value;
        if (value <= 1) {
          window.clearInterval(id);
          setExpired(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [minutes]);

  const mm = left === null ? "--" : String(Math.floor(left / 60)).padStart(2, "0");
  const ss = left === null ? "--" : String(left % 60).padStart(2, "0");

  return (
    <div className="grid gap-6">
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
          left !== null && left < 60 ? "border-[var(--danger)]" : "border-[var(--line)]"
        }`}
      >
        <p className="text-sm">
          {examSectionMeta(levelId, section).titleDe} · mock clock
        </p>
        <p className={`font-medium tabular-nums ${left !== null && left < 60 ? "text-[var(--danger)]" : ""}`}>
          {mm}:{ss}
        </p>
      </div>
      {expired ? (
        <p className="rounded-2xl border border-[var(--danger)] px-4 py-3 text-sm leading-7">
          Time for this paper is up. Finish the item you are on, then continue — in the real
          room you would stop writing.
        </p>
      ) : null}
      <LessonPlayer
        levelId={levelId}
        chapterSlug="exam"
        chapterTitle={`${levelId.toUpperCase()} · ${examSectionMeta(levelId, section).titleDe}`}
        lesson={lesson}
        nextHref={nextHref}
      />
    </div>
  );
}
