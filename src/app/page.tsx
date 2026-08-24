import Link from "next/link";
import { UserGreeting } from "@/components/UserGreeting";
import { getLevels, countCurriculum } from "@/content/index";

export default function HomePage() {
  const levels = getLevels();
  const counts = countCurriculum();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            A1 → C1
          </p>
          <UserGreeting className="mt-3 text-[var(--accent)]" />
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            German that starts on the page, then moves into your hands.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Read tiny texts first. Write short, correct sentences next. Then climb
            through {counts.chapters} chapters and {counts.lessons} interactive
            lessons — drag, tap, type, and listen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/courses/a1"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-[var(--accent-ink)]"
            >
              Start at A1
            </Link>
            <Link href="/courses" className="chip">
              Browse all levels
            </Link>
          </div>
        </div>
        <ol className="grid gap-3">
          {levels.map((level, index) => (
            <li key={level.id}>
              <Link
                href={`/courses/${level.id}`}
                className="block rounded-3xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-elev)_80%,transparent)] p-4 transition hover:-translate-y-0.5"
              >
                <p className="text-xs text-[var(--muted)]">
                  0{index + 1} · {level.stage}
                </p>
                <p className="mt-1 font-medium">{level.name}</p>
                <p className="text-sm text-[var(--muted)]">{level.summary}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
