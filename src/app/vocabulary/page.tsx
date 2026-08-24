"use client";

import { getLevels } from "@/content/index";
import { articleClass } from "@/lib/german";
import { useApp } from "@/components/Providers";

export default function VocabularyPage() {
  const { progress, starWord } = useApp();
  const levels = getLevels();
  const starred = new Set(progress.starred);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Vocabulary</h1>
      <p className="mt-3 text-[var(--muted)]">
        Star words during matching lessons, then review them here. Article colors
        follow your settings.
      </p>
      {progress.starred.length ? (
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <h2 className="font-medium">Starred</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {progress.starred.map((word) => (
              <li key={word} className="flex items-center justify-between gap-4 py-2">
                <span className={articleClass(word)}>{word}</span>
                <button type="button" className="chip" onClick={() => starWord(word)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No starred words yet. Open a matching lesson and tap the star.
        </p>
      )}
      {levels.map((level) => (
        <section key={level.id} className="mt-10">
          <h2 className="text-2xl font-semibold">{level.name}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {level.chapters.map((chapter) => (
              <article
                key={chapter.slug}
                className="rounded-2xl border border-[var(--line)] p-4"
              >
                <h3 className="font-medium">{chapter.title}</h3>
                <ul className="mt-2 grid gap-1 text-sm">
                  {chapter.vocab.slice(0, 8).map((item, index) => (
                    <li key={`${item.de}-${index}`}>
                      <span className={articleClass(item.de)}>{item.de}</span>
                      <span className="text-[var(--muted)]"> — {item.en}</span>
                      {starred.has(item.de) ? " ★" : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
