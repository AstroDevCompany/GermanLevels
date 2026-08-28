import { chapter, phrase, q, reading, sentence, vocab, writing } from "@/content/helpers";
import type { ChapterSource, Skill } from "@/content/types";

type VocabTuple = [string, string] | [string, string, string];

export function packChapter(opts: {
  slug: string;
  title: string;
  titleDe: string;
  blurb: string;
  skill: Skill;
  grammar: string[];
  vocab: VocabTuple[];
  phrases: Array<[string, string]>;
  sentences: Array<[string, string]>;
  readings: Array<{
    title: string;
    titleDe: string;
    text: string;
    translation: string;
    questions: Array<[string, string, string[]]>;
  }>;
  writings: Array<[string, string, string, string[]]>;
}): ChapterSource {
  return chapter(opts.slug, opts.title, opts.titleDe, opts.blurb, opts.skill, opts.grammar, {
    vocab: opts.vocab.map((entry) =>
      vocab(entry[0], entry[1], undefined, entry.length === 3 ? entry[2] : undefined),
    ),
    phrases: opts.phrases.map((entry) => phrase(entry[0], entry[1])),
    sentences: opts.sentences.map((entry) => sentence(entry[0], entry[1])),
    readings: opts.readings.map((item) =>
      reading(
        item.title,
        item.titleDe,
        item.text,
        item.translation,
        item.questions.map((question) => q(question[0], question[1], question[2])),
      ),
    ),
    writings: opts.writings.map((item) => writing(item[0], item[1], item[2], item[3])),
  });
}
