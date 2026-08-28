import { getLevels, countCurriculum } from "../src/content/index";

const counts = countCurriculum();
for (const level of getLevels()) {
  const lessons = new Set(level.chapters.map((chapter) => chapter.lessons.length));
  const vocab = level.chapters.reduce((sum, chapter) => sum + chapter.vocab.length, 0);
  const leftover = level.chapters.filter((chapter) => {
    const last = chapter.lessons[chapter.lessons.length - 1];
    return (last?.newVocab.length ?? 0) > 0 && last?.role === "review";
  });
  console.log(
    `${level.id}: ${level.chapters.length} chapters, lessons/chapter=${[...lessons].join(",")}`,
    `vocab items=${vocab}`,
    leftover.length ? `leftover-on-last=${leftover.map((c) => c.slug).join(",")}` : "no leftover dump",
  );
}
console.log(counts);
