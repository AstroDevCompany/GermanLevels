import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChapterBrowser } from "@/components/ChapterBrowser";
import { getChapter, getLevel } from "@/content/index";
import { LEVEL_ORDER } from "@/lib/levels";
import type { LevelId } from "@/content/types";

export function generateStaticParams() {
  return LEVEL_ORDER.flatMap((level) => {
    const data = getLevel(level);
    return (data?.chapters ?? []).map((chapter) => ({
      level,
      chapter: chapter.slug,
    }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; chapter: string }>;
}): Promise<Metadata> {
  const { level, chapter } = await params;
  return { title: getChapter(level, chapter)?.title ?? "Chapter" };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ level: string; chapter: string }>;
}) {
  const { level, chapter: slug } = await params;
  const data = getLevel(level);
  const chapter = getChapter(level, slug);
  if (!data || !chapter) notFound();
  const index = data.chapters.findIndex((item) => item.slug === slug);
  const prev = data.chapters[index - 1];
  const next = data.chapters[index + 1];

  return (
    <ChapterBrowser
      levelId={level as LevelId}
      chapter={chapter}
      prev={prev ? { slug: prev.slug, title: prev.title } : null}
      next={next ? { slug: next.slug, title: next.title } : null}
    />
  );
}
