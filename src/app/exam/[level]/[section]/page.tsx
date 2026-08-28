import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExamSectionPlayer } from "@/components/ExamSectionPlayer";
import { getExamLesson, isExamSection, EXAM_SECTIONS } from "@/content/exam/papers";
import { isLevelId, LEVEL_ORDER } from "@/lib/levels";

export function generateStaticParams() {
  return LEVEL_ORDER.flatMap((level) =>
    EXAM_SECTIONS.map((section) => ({ level, section })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; section: string }>;
}): Promise<Metadata> {
  const { level, section } = await params;
  return { title: `${section} · ${level.toUpperCase()} mock` };
}

export default async function ExamSectionPage({
  params,
}: {
  params: Promise<{ level: string; section: string }>;
}) {
  const { level, section } = await params;
  if (!isLevelId(level) || !isExamSection(section)) notFound();
  const lesson = getExamLesson(level, section);
  const index = EXAM_SECTIONS.indexOf(section);
  const next = EXAM_SECTIONS[index + 1];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href={`/exam/${level}`} className="text-sm text-[var(--accent)]">
        Back to {level.toUpperCase()} papers
      </Link>
      <div className="mt-6">
        <ExamSectionPlayer
          levelId={level}
          section={section}
          lesson={lesson}
          nextHref={next ? `/exam/${level}/${next}` : `/exam/${level}`}
        />
      </div>
    </main>
  );
}
