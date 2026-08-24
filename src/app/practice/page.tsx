"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { GermanChars, insertChar } from "@/components/GermanChars";
import { getLevels } from "@/content/index";
import { answersMatch } from "@/lib/german";
import { useApp } from "@/components/Providers";

export default function PracticePage() {
  const { prefs } = useApp();
  const bank = useMemo(() => {
    const level = getLevels().find((item) => item.id === prefs.startingLevel) ?? getLevels()[0];
    const chapter = level.chapters[0];
    return chapter.vocab.slice(0, 8);
  }, [prefs.startingLevel]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const item = bank[index];

  if (!item) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">Practice</h1>
      <p className="mt-3 text-[var(--muted)]">
        A quick mix from your starting level. Change that level in Settings.
      </p>
      <section className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6">
        <p className="leading-7">Type the German for “{item.en}”.</p>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="mt-5 w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3"
        />
        <GermanChars
          onInsert={(char) => setValue((current) => insertChar(current, char, inputRef.current))}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
            onClick={() => {
              const ok = answersMatch(value, [item.de, item.de.replace(/^(der|die|das)\s+/i, "")]);
              setMessage(ok ? "Correct." : `Answer: ${item.de}`);
            }}
          >
            Check
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setValue("");
              setMessage("");
              setIndex((current) => (current + 1) % bank.length);
            }}
          >
            Next
          </button>
        </div>
        {message ? <p className="mt-4">{message}</p> : null}
      </section>
      <Link href="/courses" className="mt-6 inline-block text-[var(--accent)]">
        Open full courses
      </Link>
    </main>
  );
}
