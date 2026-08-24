import type {
  ChapterSource,
  Phrase,
  Reading,
  Sentence,
  Skill,
  VocabItem,
  WritingPrompt,
} from "@/content/types";
import { getArticle } from "@/lib/german";

export function vocab(de: string, en: string, hint?: string, plural?: string): VocabItem {
  const article = getArticle(de);
  const gender =
    article === "der" ? "m" : article === "die" ? "f" : article === "das" ? "n" : undefined;
  return { de, en, hint, plural, gender };
}

export function phrase(de: string, en: string, note?: string): Phrase {
  return { de, en, note };
}

export function sentence(de: string, en: string): Sentence {
  return { de, en };
}

export function reading(
  title: string,
  titleDe: string,
  text: string,
  translation: string,
  questions: Reading["questions"],
): Reading {
  return { title, titleDe, text, translation, questions };
}

export function writing(
  prompt: string,
  promptDe: string,
  sample: string,
  hints: string[],
): WritingPrompt {
  return { prompt, promptDe, sample, hints };
}

export function chapter(
  slug: string,
  title: string,
  titleDe: string,
  blurb: string,
  skill: Skill,
  grammar: string[],
  entries: {
    vocab: VocabItem[];
    phrases: Phrase[];
    sentences: Sentence[];
    readings: Reading[];
    writings: WritingPrompt[];
  },
): ChapterSource {
  return { slug, title, titleDe, blurb, skill, grammar, ...entries };
}

export function q(
  question: string,
  answer: string,
  options: string[],
  explain?: string,
): Reading["questions"][number] {
  return { question, options, answer, explain };
}
