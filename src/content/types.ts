export type LevelId = "a1" | "a2" | "b1" | "b2" | "c1";

export type Skill =
  | "reading"
  | "writing"
  | "vocab"
  | "grammar"
  | "listening"
  | "mixed";

export type Gender = "m" | "f" | "n" | "pl";

export type VocabItem = {
  de: string;
  en: string;
  gender?: Gender;
  plural?: string;
  hint?: string;
};

export type Phrase = {
  de: string;
  en: string;
  note?: string;
};

export type Sentence = {
  de: string;
  en: string;
};

export type ReadingQuestion = {
  question: string;
  options: string[];
  answer: string;
  explain?: string;
};

export type Reading = {
  title: string;
  titleDe: string;
  text: string;
  translation: string;
  questions: ReadingQuestion[];
};

export type WritingPrompt = {
  prompt: string;
  promptDe: string;
  sample: string;
  hints: string[];
};

export type ChapterSource = {
  slug: string;
  title: string;
  titleDe: string;
  blurb: string;
  skill: Skill;
  grammar: string[];
  vocab: VocabItem[];
  phrases: Phrase[];
  sentences: Sentence[];
  readings: Reading[];
  writings: WritingPrompt[];
};

export type MultipleChoiceExercise = {
  type: "multiple-choice";
  id: string;
  prompt: string;
  promptDe?: string;
  options: string[];
  answer: string;
  explain?: string;
  speak?: string;
};

export type FillBlankExercise = {
  type: "fill-blank";
  id: string;
  prompt: string;
  sentence: string;
  answer: string | string[];
  hint?: string;
  options?: string[];
  speak?: string;
};

export type TypeAnswerExercise = {
  type: "type-answer";
  id: string;
  prompt: string;
  answer: string | string[];
  hint?: string;
  speak?: string;
};

export type DragOrderExercise = {
  type: "drag-order";
  id: string;
  prompt: string;
  words: string[];
  answer: string[];
  translation?: string;
  speak?: string;
};

export type MatchingExercise = {
  type: "matching";
  id: string;
  prompt: string;
  pairs: { left: string; right: string }[];
};

export type TrueFalseExercise = {
  type: "true-false";
  id: string;
  prompt: string;
  statement: string;
  answer: boolean;
  explain?: string;
  speak?: string;
};

export type ListenChoiceExercise = {
  type: "listen-choice";
  id: string;
  prompt: string;
  speak: string;
  options: string[];
  answer: string;
  explain?: string;
};

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | TypeAnswerExercise
  | DragOrderExercise
  | MatchingExercise
  | TrueFalseExercise
  | ListenChoiceExercise;

export type TeachRow = {
  de: string;
  en: string;
  note?: string;
};

export type TeachCard = {
  id: string;
  kind: "reading" | "list" | "grammar" | "model";
  eyebrow: string;
  title: string;
  titleDe?: string;
  body?: string;
  translation?: string;
  speak?: string;
  points?: string[];
  rows?: TeachRow[];
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  titleDe: string;
  skill: Skill;
  summary: string;
  estimatedMinutes: number;
  passage?: {
    title: string;
    titleDe: string;
    text: string;
    translation: string;
  };
  grammarNote?: string;
  teaching: TeachCard[];
  exercises: Exercise[];
};

export type Chapter = {
  slug: string;
  number: number;
  title: string;
  titleDe: string;
  blurb: string;
  skill: Skill;
  grammar: string[];
  vocab: VocabItem[];
  lessons: Lesson[];
};

export type Level = {
  id: LevelId;
  name: string;
  nameDe: string;
  stage: string;
  color: string;
  summary: string;
  focus: string[];
  chapters: Chapter[];
};
