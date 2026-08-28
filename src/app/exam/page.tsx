import type { Metadata } from "next";
import Link from "next/link";
import { examLevels, examMinutes } from "@/content/exam/papers";
import { LEVEL_META } from "@/lib/levels";

export const metadata: Metadata = { title: "Mock exams" };

export default function ExamHubPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Prüfungsmodus</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Practice papers</h1>
      <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
        Four skills, German first, a clock on the page — the shape of Goethe and telc,
        shorter than the official sitting. This is training, not a certificate.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {examLevels().map((id) => {
          const meta = LEVEL_META[id];
          return (
            <Link
              key={id}
              href={`/exam/${id}`}
              className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 transition hover:-translate-y-0.5"
            >
              <p className="text-sm text-[var(--muted)]">{meta.stage}</p>
              <h2 className="mt-1 text-2xl font-semibold">{meta.name}</h2>
              <p className="mt-2 text-[var(--muted)]">
                Lesen · Hören · Schreiben · Sprechen · about {examMinutes(id)} minutes
              </p>
            </Link>
          );
        })}
      </div>
      <p className="mt-10 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        Everyday A1–B1 conversations live under{" "}
        <Link href="/conversations" className="text-[var(--accent)]">
          Conversations
        </Link>
        — café, doctor, train, landlord — so the papers do not become the only German you speak.
      </p>
    </main>
  );
}
