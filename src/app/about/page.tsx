import type { Metadata } from "next";
import Link from "next/link";
import { countCurriculum } from "@/content/index";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const counts = countCurriculum();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">The method</h1>
      <p className="mt-4 leading-8 text-[var(--muted)]">
        GermanLevels is a full A1–C1 path with {counts.chapters} chapters and{" "}
        {counts.lessons} lessons. You begin with sounds and short reading, then
        write lists and mini-sentences, then move into grammar, narration, and
        public language.
      </p>
      <ol className="mt-8 grid gap-3">
        <li className="rounded-2xl border border-[var(--line)] p-4">
          1. Read a tiny authentic-style text before you produce anything.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          2. Match, choose, drag, and type — every lesson is interactive.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          3. Write only after you have seen a model on the same page.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          4. Keep der/die/das visible. Customize accent, type size, and hints.
        </li>
      </ol>
      <Link href="/courses/a1" className="mt-8 inline-block text-[var(--accent)]">
        Begin with A1, chapter 1
      </Link>
    </main>
  );
}
