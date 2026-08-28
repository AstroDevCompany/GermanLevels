import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExamLevelView } from "@/components/ExamLevelView";
import { EXAM_SECTIONS, examMinutes } from "@/content/exam/papers";
import { getLevel } from "@/content/index";
import { LEVEL_ORDER } from "@/lib/levels";

export function generateStaticParams() {
  return LEVEL_ORDER.map((level) => ({ level }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string }>;
}): Promise<Metadata> {
  const { level } = await params;
  return { title: `Mock exam ${level.toUpperCase()}` };
}

export default async function ExamLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const data = getLevel(level);
  if (!data) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/exam" className="text-sm text-[var(--accent)]">
        All practice papers
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{data.nameDe}</h1>
      <p className="mt-3 leading-8 text-[var(--muted)]">
        Four papers, about {examMinutes(data.id)} minutes together. Do them in order on a
        quiet day, or one skill at a time.
      </p>
      <ExamLevelView
        levelId={data.id}
        sections={EXAM_SECTIONS}
      />
    </main>
  );
}
