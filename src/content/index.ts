import { buildLevel } from "@/content/generateLessons";
import type { Chapter, Lesson, Level, LevelId } from "@/content/types";
import { mergeChapterExtras } from "@/content/helpers";
import { isLevelId, LEVEL_ORDER } from "@/lib/levels";
import { a1Chapters } from "@/content/levels/a1-part1";
import { a1ChaptersPart2 } from "@/content/levels/a1-part2";
import { a1ChaptersPart3 } from "@/content/levels/a1-part3";
import { a1Expand } from "@/content/levels/a1-expand";
import { a2ChaptersPart1 } from "@/content/levels/a2-part1";
import { a2ChaptersPart2 } from "@/content/levels/a2-part2";
import { a2ChaptersPart3 } from "@/content/levels/a2-part3";
import { a2Expand } from "@/content/levels/a2-expand";
import { b1ChaptersPart1 } from "@/content/levels/b1-part1";
import { b1ChaptersPart2 } from "@/content/levels/b1-part2";
import { b2ChaptersPart1 } from "@/content/levels/b2-part1";
import { b2ChaptersPart2 } from "@/content/levels/b2-part2";
import { c1ChaptersPart1 } from "@/content/levels/c1-part1";
import { c1ChaptersPart2 } from "@/content/levels/c1-part2";

const LEVELS: Record<LevelId, Level> = {
  a1: buildLevel(
    "a1",
    [...a1Chapters, ...a1ChaptersPart2, ...a1ChaptersPart3].map((source) =>
      mergeChapterExtras(source, a1Expand[source.slug]),
    ),
  ),
  a2: buildLevel(
    "a2",
    [...a2ChaptersPart1, ...a2ChaptersPart2, ...a2ChaptersPart3].map((source) =>
      mergeChapterExtras(source, a2Expand[source.slug]),
    ),
  ),
  b1: buildLevel("b1", [...b1ChaptersPart1, ...b1ChaptersPart2]),
  b2: buildLevel("b2", [...b2ChaptersPart1, ...b2ChaptersPart2]),
  c1: buildLevel("c1", [...c1ChaptersPart1, ...c1ChaptersPart2]),
};

export function getLevels(): Level[] {
  return LEVEL_ORDER.map((id) => LEVELS[id]);
}

export function getLevel(id: string): Level | undefined {
  if (!isLevelId(id)) return undefined;
  return LEVELS[id];
}

export function getChapter(levelId: string, slug: string): Chapter | undefined {
  return getLevel(levelId)?.chapters.find((chapter) => chapter.slug === slug);
}

export function getLesson(
  levelId: string,
  chapterSlug: string,
  lessonId: string,
): Lesson | undefined {
  return getChapter(levelId, chapterSlug)?.lessons.find((lesson) => lesson.id === lessonId);
}

export function getAllLessonParams() {
  return getLevels().flatMap((level) =>
    level.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        level: level.id,
        chapter: chapter.slug,
        lesson: lesson.id,
      })),
    ),
  );
}

export function countCurriculum() {
  const levels = getLevels();
  const chapters = levels.reduce((sum, level) => sum + level.chapters.length, 0);
  const lessons = levels.reduce(
    (sum, level) =>
      sum + level.chapters.reduce((inner, chapter) => inner + chapter.lessons.length, 0),
    0,
  );
  return { levels: levels.length, chapters, lessons };
}
