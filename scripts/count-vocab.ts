import { a1Chapters } from "../src/content/levels/a1-part1";
import { a1ChaptersPart2 } from "../src/content/levels/a1-part2";
import { a1ChaptersPart3 } from "../src/content/levels/a1-part3";
import { a1Expand } from "../src/content/levels/a1-expand";
import { a2ChaptersPart1 } from "../src/content/levels/a2-part1";
import { a2ChaptersPart2 } from "../src/content/levels/a2-part2";
import { a2ChaptersPart3 } from "../src/content/levels/a2-part3";
import { a2Expand } from "../src/content/levels/a2-expand";
import { mergeChapterExtras } from "../src/content/helpers";
import type { ChapterSource } from "../src/content/types";

function norm(value: string) {
  return value.replace(/^(der|die|das)\s+/i, "").trim().toLowerCase();
}

function collect(chapters: ChapterSource[], label: string) {
  const vocab = new Set<string>();
  for (const chapter of chapters) {
    const words = chapter.vocab.map((item) => item.de);
    for (const item of chapter.vocab) vocab.add(norm(item.de));
    console.log(`\n## ${label} ${chapter.slug} (${chapter.vocab.length})`);
    console.log(words.join(" | "));
  }
  return vocab;
}

const a1 = collect(
  [...a1Chapters, ...a1ChaptersPart2, ...a1ChaptersPart3].map((source) =>
    mergeChapterExtras(source, a1Expand[source.slug]),
  ),
  "a1",
);
const a2 = collect(
  [...a2ChaptersPart1, ...a2ChaptersPart2, ...a2ChaptersPart3].map((source) =>
    mergeChapterExtras(source, a2Expand[source.slug]),
  ),
  "a2",
);
const both = new Set([...a1, ...a2]);
console.log(
  JSON.stringify({
    a1: a1.size,
    a2: a2.size,
    combined: both.size,
    overlap: [...a1].filter((item) => a2.has(item)).length,
  }),
);
