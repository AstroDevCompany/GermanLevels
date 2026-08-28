import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { LevelChapters } from "@/components/LevelChapters";
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
  const data = getLevel(level);
  return { title: data?.name ?? "Level" };
}

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const data = getLevel(level);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-[var(--muted)]">{data.stage}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{data.name}</h1>
      <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">{data.summary}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/exam/${data.id}`}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
        >
          {data.id.toUpperCase()} mock exam
        </Link>
        {data.id === "a1" || data.id === "a2" || data.id === "b1" ? (
          <Link href="/conversations" className="chip">
            Everyday conversations
          </Link>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {data.focus.map((item) => (
          <span key={item} className="chip text-sm">
            {item}
          </span>
        ))}
      </div>
      <LevelChapters level={data} />
    </main>
  );
}
