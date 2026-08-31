export type LevelId = "a1" | "a2" | "b1" | "b2" | "c1";

export type Skill =
  | "reading"
  | "writing"
  | "vocab"
  | "grammar"
  | "listening"
  | "speaking"
  | "mixed";

export type LessonRole = "introduction" | "practice" | "application" | "review";

export type LessonPhase =
  | "learn"
  | "understand"
  | "controlled-practice"
  | "recall"
  | "application"
  | "review";

export type ExerciseModality =
  | "recognition"
  | "recall"
  | "completion"
  | "construction"
  | "translation"
  | "production";

export type ErrorKind =
  | "forgotten-vocabulary"
  | "misunderstood-grammar"
  | "careless-mistake"
  | "spelling-error"
  | "word-order-error";

export type ErrorCategory =
  | "noun-gender"
  | "verb-conjugation"
  | "word-order"
  | "vocabulary"
  | "spelling"
  | "articles"
  | "case"
  | "other";

export type Confidence = "low" | "medium" | "high";

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

export type WritingRegister = "informal" | "formal" | "academic";

export type WritingRubric = {
  minWords: number;
  targetWords?: number;
  keywords?: string[];
  register?: WritingRegister;
  connectors?: string[];
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

export type TeachRow = {
  de: string;
  en: string;
  note?: string;
};

export type ConceptLessonRef = {
  lessonId: string;
  number: number;
  title: string;
};

export type GrammarConcept = {
  id: string;
  title: string;
  titleDe: string;
  level: LevelId;
  chapterSlug: string;
  summary: string;
  prerequisites: string[];
  commonMistakes: string[];
  vocabDependencies: string[];
  forms?: TeachRow[];
  examples?: Sentence[];
  applicationPrompt?: string;
  applicationPromptDe?: string;
  applicationSample?: string;
  applicationKeywords?: string[];
  introductionLesson?: ConceptLessonRef;
  practiceLessons?: ConceptLessonRef[];
  reviewLessons?: ConceptLessonRef[];
};

export type ExerciseMeta = {
  id: string;
  conceptId?: string;
  modality?: ExerciseModality;
  phase?: LessonPhase;
  target?: string;
  errorCategory?: ErrorCategory;
  targeted?: boolean;
  promptDe?: string;
};

export type MultipleChoiceExercise = ExerciseMeta & {
  type: "multiple-choice";
  prompt: string;
  promptDe?: string;
  options: string[];
  answer: string;
  explain?: string;
  speak?: string;
};

export type FillBlankExercise = ExerciseMeta & {
  type: "fill-blank";
  prompt: string;
  sentence: string;
  answer: string | string[];
  hint?: string;
  options?: string[];
  speak?: string;
};

export type TypeAnswerExercise = ExerciseMeta & {
  type: "type-answer";
  prompt: string;
  answer: string | string[];
  hint?: string;
  speak?: string;
};

export type DragOrderExercise = ExerciseMeta & {
  type: "drag-order";
  prompt: string;
  words: string[];
  answer: string[];
  translation?: string;
  speak?: string;
};

export type MatchingExercise = ExerciseMeta & {
  type: "matching";
  prompt: string;
  pairs: { left: string; right: string }[];
};

export type TrueFalseExercise = ExerciseMeta & {
  type: "true-false";
  prompt: string;
  statement: string;
  answer: boolean;
  explain?: string;
  speak?: string;
};

export type ListenChoiceExercise = ExerciseMeta & {
  type: "listen-choice";
  prompt: string;
  speak: string;
  options: string[];
  answer: string;
  explain?: string;
};

export type FreeProductionExercise = ExerciseMeta & {
  type: "free-production";
  prompt: string;
  promptDe?: string;
  sample: string;
  keywords?: string[];
  minSentences?: number;
  hints?: string[];
  rubric?: WritingRubric;
};

export type SpeakResponseExercise = ExerciseMeta & {
  type: "speak-response";
  prompt: string;
  promptDe?: string;
  sample: string;
  keywords?: string[];
  speak?: string;
  situation?: string;
  situationDe?: string;
  minSeconds?: number;
};

export type ListenComprehensionExercise = ExerciseMeta & {
  type: "listen-comprehension";
  prompt: string;
  promptDe?: string;
  speak: string;
  maxPlays: number;
  question: string;
  options: string[];
  answer: string;
  explain?: string;
};

export type DialogueTurn = {
  speaker: "npc" | "you";
  de: string;
  en?: string;
  keywords?: string[];
};

export type DialogueExercise = ExerciseMeta & {
  type: "dialogue";
  prompt: string;
  promptDe?: string;
  setting: string;
  settingDe: string;
  turns: DialogueTurn[];
};

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | TypeAnswerExercise
  | DragOrderExercise
  | MatchingExercise
  | TrueFalseExercise
  | ListenChoiceExercise
  | ListenComprehensionExercise
  | FreeProductionExercise
  | SpeakResponseExercise
  | DialogueExercise;

export type TeachCard = {
  id: string;
  kind: "reading" | "list" | "grammar" | "model" | "situation";
  eyebrow: string;
  title: string;
  titleDe?: string;
  body?: string;
  translation?: string;
  speak?: string;
  points?: string[];
  rows?: TeachRow[];
  phase?: LessonPhase;
};

export type Lesson = {
  id: string;
  number: number;
  title: string;
  titleDe: string;
  skill: Skill;
  role: LessonRole;
  optional?: boolean;
  summary: string;
  estimatedMinutes: number;
  conceptIds: string[];
  newVocab: VocabItem[];
  recycledVocab: VocabItem[];
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
  concepts: GrammarConcept[];
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
