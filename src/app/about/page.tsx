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
        {counts.lessons} lessons, plus conversation scenes and timed mock papers.
        A1 and A2 aim at everyday talk. B1 to C1 aim at the four skills a Goethe or
        telc examiner actually marks.
      </p>
      <ol className="mt-8 grid gap-3">
        <li className="rounded-2xl border border-[var(--line)] p-4">
          1. Hear a scene, then speak or type your line — not only pick an English gloss.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          2. Read exam-length texts. Questions stay in German.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          3. Writing is scored on Inhalt, Aufbau, Wortschatz, and Korrektheit.
        </li>
        <li className="rounded-2xl border border-[var(--line)] p-4">
          4. Sit a short mock: Lesen, Hören (twice only), Schreiben, Sprechen.
        </li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/courses/a1" className="text-[var(--accent)]">
          Begin with A1
        </Link>
        <Link href="/exam" className="text-[var(--accent)]">
          Open practice papers
        </Link>
      </div>
    </main>
  );
}
