import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getChapter, getLesson } from "@/content/index";
import type { LevelId } from "@/content/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; chapter: string; lesson: string }>;
}): Promise<Metadata> {
  const { level, chapter, lesson } = await params;
  return { title: getLesson(level, chapter, lesson)?.title ?? "Lesson" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ level: string; chapter: string; lesson: string }>;
}) {
  const { level, chapter, lesson: lessonId } = await params;
  const chapterData = getChapter(level, chapter);
  const lesson = getLesson(level, chapter, lessonId);
  if (!chapterData || !lesson) notFound();
  const next = chapterData.lessons.find((item) => item.number === lesson.number + 1);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/courses/${level}/${chapter}`}
        className="text-sm text-[var(--accent)]"
      >
        {chapterData.title}
      </Link>
      <div className="mt-6">
        <LessonPlayer
          levelId={level as LevelId}
          chapterSlug={chapter}
          chapterTitle={chapterData.title}
          lesson={lesson}
          nextHref={
            next
              ? `/courses/${level}/${chapter}/${next.id}`
              : `/courses/${level}/${chapter}`
          }
        />
      </div>
    </main>
  );
}
