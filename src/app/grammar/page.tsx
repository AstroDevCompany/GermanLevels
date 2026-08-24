import Link from "next/link";
import type { Metadata } from "next";
import { GRAMMAR_TOPICS } from "@/content/grammar";

export const metadata: Metadata = { title: "Grammar" };

export default function GrammarPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Grammar desk</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Short reference pages that sit beside the courses. Open a topic, then go
        back to the matching chapter and practise it.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {GRAMMAR_TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/grammar/${topic.slug}`}
            className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5"
          >
            <p className="text-sm text-[var(--muted)]">{topic.level}</p>
            <h2 className="text-xl font-medium">{topic.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{topic.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
