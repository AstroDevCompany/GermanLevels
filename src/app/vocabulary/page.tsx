"use client";

import { useMemo } from "react";
import { getLevels } from "@/content/index";
import { RevealList } from "@/components/RevealList";
import { useApp } from "@/components/Providers";

export default function VocabularyPage() {
  const { progress, starWord } = useApp();
  const levels = getLevels();
  const meanings = useMemo(() => {
    const map = new Map<string, string>();
    for (const level of levels) {
      for (const chapter of level.chapters) {
        for (const item of chapter.vocab) {
          if (!map.has(item.de)) map.set(item.de, item.en);
        }
      }
    }
    return map;
  }, [levels]);
  const starredRows = progress.starred.map((de) => ({
    de,
    en: meanings.get(de) ?? "",
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Vocabulary</h1>
      <p className="mt-3 text-[var(--muted)]">
        Star words during lessons, then review them here. Meanings stay hidden
        until you tap. Article colors follow your settings.
      </p>
      {starredRows.length ? (
        <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <h2 className="font-medium">Starred</h2>
          <RevealList
            rows={starredRows}
            starred={progress.starred}
            onStar={starWord}
          />
        </section>
      ) : (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No starred words yet. Open a lesson and tap the star.
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
                <RevealList rows={chapter.vocab.slice(0, 8)} compact />
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
