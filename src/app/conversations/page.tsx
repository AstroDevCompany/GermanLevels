import type { Metadata } from "next";
import Link from "next/link";
import { CONVERSATIONS } from "@/content/conversations";
import { LEVEL_META, LEVEL_ORDER } from "@/lib/levels";

export const metadata: Metadata = { title: "Conversations" };

export default function ConversationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Alltag</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Scenes you might actually have</h1>
      <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">
        Café, neighbour, phone, train, doctor, pharmacy, landlord, meeting. Hear the other
        person twice if you must, then take your turn — type or speak. A and B courses
        should get you through the day, not only through a worksheet.
      </p>
      <div className="mt-10 grid gap-10">
        {LEVEL_ORDER.map((level) => {
          const missions = CONVERSATIONS.filter((item) => item.level === level);
          if (!missions.length) return null;
          return (
            <section key={level}>
              <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
                {LEVEL_META[level].nameDe}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {missions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/conversations/${mission.id}`}
                    className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 transition hover:-translate-y-0.5"
                  >
                    <p className="text-sm text-[var(--muted)]">{mission.minutes} min · play the scene</p>
                    <h3 className="mt-2 text-xl font-semibold">{mission.titleDe}</h3>
                    <p className="mt-1 text-[var(--muted)]">{mission.title}</p>
                    <p className="mt-4 text-sm leading-7">{mission.settingDe}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
