import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GRAMMAR_TOPICS } from "@/content/grammar";

export function generateStaticParams() {
  return GRAMMAR_TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  return {
    title: GRAMMAR_TOPICS.find((item) => item.slug === topic)?.title ?? "Grammar",
  };
}

export default async function GrammarTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const topic = GRAMMAR_TOPICS.find((item) => item.slug === slug);
  if (!topic) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/grammar" className="text-sm text-[var(--accent)]">
        All topics
      </Link>
      <p className="mt-4 text-sm text-[var(--muted)]">{topic.level}</p>
      <h1 className="text-4xl font-semibold tracking-tight">{topic.title}</h1>
      <p className="mt-3 text-[var(--muted)]">{topic.summary}</p>
      <ul className="mt-8 grid gap-3">
        {topic.points.map((point) => (
          <li key={point} className="rounded-2xl border border-[var(--line)] px-4 py-3">
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4">
        {topic.examples.map((example) => (
          <figure
            key={example.de}
            className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5"
          >
            <blockquote className="reading-serif text-xl leading-8">{example.de}</blockquote>
            <figcaption className="mt-3 text-[var(--muted)]">{example.en}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
