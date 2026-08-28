"use client";

import Link from "next/link";
import { EXAM_SECTIONS, examSectionMeta, type ExamSectionId } from "@/content/exam/papers";
import type { LevelId } from "@/content/types";
import { lessonKey, lessonPercent } from "@/lib/progress";
import { ProgressMark } from "@/components/ProgressMark";
import { useApp } from "@/components/Providers";

export function ExamLevelView({
  levelId,
  sections,
}: {
  levelId: LevelId;
  sections: readonly ExamSectionId[];
}) {
  const { progress } = useApp();
  return (
    <div className="mt-8 grid gap-4">
      {sections.map((section) => {
        const meta = examSectionMeta(levelId, section);
        const result = progress.results[lessonKey(levelId, "exam", section)];
        const percent = lessonPercent(result);
        return (
          <Link
            key={section}
            href={`/exam/${levelId}/${section}`}
            className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6"
          >
            <p className="text-sm text-[var(--muted)]">
              {meta.title} · {meta.minutes} min
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{meta.titleDe}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {section === "lesen"
                ? "Two texts, questions in German."
                : section === "hoeren"
                  ? "Connected speech, two plays."
                  : section === "schreiben"
                    ? "One task, marked on four criteria."
                    : "Introduce yourself, then a scene."}
            </p>
            <ProgressMark percent={percent} started={percent > 0} />
          </Link>
        );
      })}
      <p className="text-sm text-[var(--muted)]">
        Official order: {EXAM_SECTIONS.map((id) => examSectionMeta(levelId, id).titleDe).join(" → ")}.
      </p>
    </div>
  );
}
