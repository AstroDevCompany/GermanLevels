import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LessonPlayer } from "@/components/LessonPlayer";
import { CONVERSATIONS, getConversation } from "@/content/conversations";
import type { Lesson } from "@/content/types";

export function generateStaticParams() {
  return CONVERSATIONS.map((item) => ({ id: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: getConversation(id)?.title ?? "Conversation" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mission = getConversation(id);
  if (!mission) notFound();
  const lesson: Lesson = {
    id: mission.id,
    number: 1,
    title: mission.title,
    titleDe: mission.titleDe,
    skill: "speaking",
    role: "application",
    summary: mission.goal,
    estimatedMinutes: mission.minutes,
    conceptIds: [],
    newVocab: [],
    recycledVocab: [],
    teaching: [
      {
        id: "scene",
        kind: "situation",
        eyebrow: "Szene",
        phase: "application",
        title: mission.titleDe,
        titleDe: mission.settingDe,
        body: mission.goalDe,
        points: [mission.setting, "Speak first if you can. Typing is a backup, not the goal."],
      },
    ],
    exercises: [
      {
        type: "dialogue",
        id: "scene-dialogue",
        prompt: mission.goal,
        promptDe: mission.goalDe,
        setting: mission.setting,
        settingDe: mission.settingDe,
        turns: mission.turns,
        modality: "production",
        phase: "application",
      },
      {
        type: "speak-response",
        id: "scene-speak",
        prompt: "Say the whole scene in your own words.",
        promptDe: "Sag die Szene in deinen Worten.",
        sample: mission.turns
          .filter((turn) => turn.speaker === "you")
          .map((turn) => turn.de)
          .join(" "),
        keywords: mission.turns.flatMap((turn) => turn.keywords ?? []).slice(0, 5),
        situationDe: mission.settingDe,
        situation: mission.setting,
        minSeconds: 6,
        modality: "production",
        phase: "application",
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/conversations" className="text-sm text-[var(--accent)]">
        All conversations
      </Link>
      <div className="mt-6">
        <LessonPlayer
          levelId={mission.level}
          chapterSlug="conversations"
          chapterTitle={mission.titleDe}
          lesson={lesson}
          nextHref="/conversations"
        />
      </div>
    </main>
  );
}
