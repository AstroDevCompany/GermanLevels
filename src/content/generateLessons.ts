import { conceptsForChapter, fallbackConcept } from "@/content/concepts";
import {
  connectedListening,
  conversationDialogue,
  dialogueFromPhrases,
  extraReadings,
  germanReadingItems,
  longReading,
  rubricFor,
  speakingPrompt,
} from "@/content/buildTasks";
import type {
  Chapter,
  ChapterSource,
  ErrorCategory,
  Exercise,
  ExerciseMeta,
  GrammarConcept,
  Lesson,
  LessonPhase,
  LessonRole,
  Level,
  LevelId,
  Phrase,
  Reading,
  Skill,
  TeachCard,
  TeachRow,
  VocabItem,
  WritingPrompt,
} from "@/content/types";
import { LEVEL_META } from "@/lib/levels";
import {
  getArticle,
  hashString,
  normalizeAnswer,
  pickDistractors,
  seededShuffle,
  splitGerman,
  splitGermanWords,
  stripArticle,
  uniqueWords,
} from "@/lib/german";

export const VOCAB_BUDGET: Record<LevelId, number> = {
  a1: 5,
  a2: 6,
  b1: 8,
  b2: 8,
  c1: 10,
};

type LessonSpec = {
  title: string;
  titleDe: string;
  skill: Skill;
  role: LessonRole;
  focus: LessonPhase;
};

const LESSON_PLAN: LessonSpec[] = [
  { title: "Learn the idea", titleDe: "Die Idee", skill: "grammar", role: "introduction", focus: "learn" },
  { title: "Controlled practice", titleDe: "Geleitete Übung", skill: "grammar", role: "practice", focus: "controlled-practice" },
  { title: "From memory", titleDe: "Aus dem Gedächtnis", skill: "writing", role: "practice", focus: "recall" },
  { title: "Use it", titleDe: "Anwenden", skill: "writing", role: "application", focus: "application" },
  { title: "First review", titleDe: "Erste Wiederholung", skill: "mixed", role: "review", focus: "review" },
  { title: "New words", titleDe: "Neue Wörter", skill: "vocab", role: "introduction", focus: "learn" },
  { title: "Build the sentence", titleDe: "Satzbau", skill: "writing", role: "practice", focus: "controlled-practice" },
  { title: "Listen for the scene", titleDe: "Die Szene hören", skill: "listening", role: "practice", focus: "recall" },
  { title: "Say it aloud", titleDe: "Laut sagen", skill: "speaking", role: "application", focus: "application" },
  { title: "In the situation", titleDe: "In der Situation", skill: "speaking", role: "application", focus: "application" },
  { title: "Grammar in focus", titleDe: "Grammatik im Fokus", skill: "grammar", role: "introduction", focus: "learn" },
  { title: "Forms in gaps", titleDe: "Formen in Lücken", skill: "grammar", role: "practice", focus: "controlled-practice" },
  { title: "Read closely", titleDe: "Genau lesen", skill: "reading", role: "practice", focus: "understand" },
  { title: "Read and produce", titleDe: "Lesen und produzieren", skill: "reading", role: "practice", focus: "recall" },
  { title: "Exam-length reading", titleDe: "Lesen wie in der Prüfung", skill: "reading", role: "review", focus: "review" },
  { title: "Write it out", titleDe: "Schreiben", skill: "writing", role: "application", focus: "application" },
  { title: "Your own words", titleDe: "Eigene Sätze", skill: "writing", role: "application", focus: "application" },
  { title: "Listen twice only", titleDe: "Nur zweimal hören", skill: "listening", role: "review", focus: "review" },
  { title: "Mixed review", titleDe: "Gemischte Wiederholung", skill: "mixed", role: "review", focus: "review" },
  { title: "Chapter exam", titleDe: "Kapitelprüfung", skill: "mixed", role: "review", focus: "review" },
];

const VOCAB_EXPANSION_PLAN: LessonSpec[] = [
  { title: "More new words", titleDe: "Noch neue Wörter", skill: "vocab", role: "introduction", focus: "learn" },
  { title: "Practise the set", titleDe: "Die Menge üben", skill: "vocab", role: "practice", focus: "controlled-practice" },
  { title: "At the counter", titleDe: "An der Theke", skill: "speaking", role: "application", focus: "application" },
  { title: "Hear the dialogue", titleDe: "Den Dialog hören", skill: "listening", role: "practice", focus: "recall" },
  { title: "Your spoken reply", titleDe: "Deine mündliche Antwort", skill: "speaking", role: "application", focus: "application" },
  { title: "Another set", titleDe: "Noch eine Menge", skill: "vocab", role: "introduction", focus: "learn" },
  { title: "Build with the set", titleDe: "Sätze bauen", skill: "writing", role: "practice", focus: "controlled-practice" },
  { title: "Read the set", titleDe: "Die Menge lesen", skill: "reading", role: "practice", focus: "understand" },
  { title: "Write the message", titleDe: "Die Nachricht schreiben", skill: "writing", role: "application", focus: "application" },
  { title: "Situation check", titleDe: "Situationscheck", skill: "mixed", role: "review", focus: "review" },
];

function lessonPlanFor(levelId: LevelId): LessonSpec[] {
  const beginner = [...LESSON_PLAN, ...VOCAB_EXPANSION_PLAN];
  if (levelId === "a1") return beginner.filter((spec) => spec.skill !== "speaking");
  if (levelId === "a2") return beginner;
  return LESSON_PLAN;
}

function displayWord(item: VocabItem): string {
  return item.de;
}

function nounPool(vocab: VocabItem[]): VocabItem[] {
  return vocab.filter((item) => Boolean(getArticle(item.de) || item.gender));
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function uniquePairs(items: { de: string; en: string }[]): { de: string; en: string }[] {
  const seen = new Set<string>();
  const out: { de: string; en: string }[] = [];
  for (const item of items) {
    const key = item.de.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

type UsedBank = {
  keys: Set<string>;
  words: Set<string>;
  sentences: Set<string>;
  passages: Set<string>;
  prompts: Set<string>;
  concepts: Set<string>;
};

function emptyUsed(): UsedBank {
  return {
    keys: new Set(),
    words: new Set(),
    sentences: new Set(),
    passages: new Set(),
    prompts: new Set(),
    concepts: new Set(),
  };
}

function lemmaOf(value: string): string {
  return normalizeAnswer(stripArticle(value));
}

function pickUnusedReading(
  readings: Reading[],
  extras: Reading[],
  used: UsedBank,
  seed: string,
): Reading | undefined {
  const start = extras.length ? hashString(seed) % extras.length : 0;
  const pool = [...readings, ...rotateItems(extras, start)];
  const unused = pool.filter(
    (item) => item.text && !used.passages.has(normalizeAnswer(item.text)),
  );
  const selected = unused[0];
  if (selected?.text) used.passages.add(normalizeAnswer(selected.text));
  return selected;
}

function composeListenScript(
  phrases: Phrase[],
  sentences: { de: string; en: string }[],
  number: number,
  used: UsedBank,
): string {
  const lines = uniquePairs([...phrases, ...sentences]).map((item) => item.de);
  const rotated = rotateItems(lines, (number - 1) * 6);
  for (let attempt = 0; attempt < Math.max(lines.length, 1); attempt += 1) {
    const script = rotateItems(rotated, attempt).slice(0, 6).join(" ").trim();
    if (!script) continue;
    const key = normalizeAnswer(script);
    if (used.passages.has(key)) continue;
    used.passages.add(key);
    return script;
  }
  const fallback = rotated.slice(0, 6).join(" ").trim();
  return fallback || "Guten Tag. Wie geht es Ihnen? Ich hätte gern Hilfe, bitte.";
}

function rotateItems<T>(items: T[], offset: number): T[] {
  if (items.length <= 1) return items.slice();
  const start = ((offset % items.length) + items.length) % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

function tag<T extends Exercise>(exercise: T, meta: Partial<ExerciseMeta>): T {
  return { ...exercise, ...meta };
}

function mc(
  id: string,
  prompt: string,
  answer: string,
  pool: string[],
  seed: string,
  extra?: { speak?: string; explain?: string; promptDe?: string },
): Exercise {
  const options = seededShuffle(
    uniqueWords([answer, ...pickDistractors(pool, answer, 3, seed)]),
    `${seed}-opt`,
  );
  return {
    type: "multiple-choice",
    id,
    prompt,
    options,
    answer,
    speak: extra?.speak,
    explain: extra?.explain,
    promptDe: extra?.promptDe ?? prompt,
    modality: "recognition",
  };
}

function vocabRows(items: VocabItem[]): TeachRow[] {
  return items.map((item) => ({
    de: item.de,
    en: item.en,
    note:
      item.hint ??
      (item.plural
        ? `Plural: ${item.plural}`
        : getArticle(item.de)
          ? `Remember ${getArticle(item.de)} with the noun.`
          : undefined),
  }));
}

function sentenceRows(items: { de: string; en: string }[]): TeachRow[] {
  return items.map((item) => ({ de: item.de, en: item.en }));
}

function readingCard(id: string, reading: Reading, body: string): TeachCard {
  return {
    id,
    kind: "reading",
    eyebrow: "Understand",
    phase: "understand",
    title: reading.title,
    titleDe: reading.titleDe,
    body,
    speak: reading.text,
    translation: reading.translation,
  };
}

function listCard(
  id: string,
  eyebrow: string,
  title: string,
  rows: TeachRow[],
  body?: string,
  phase?: LessonPhase,
): TeachCard {
  return { id, kind: "list", eyebrow, title, body, rows, phase };
}

function grammarCard(
  id: string,
  title: string,
  points: string[],
  body?: string,
  phase?: LessonPhase,
): TeachCard {
  return {
    id,
    kind: "grammar",
    eyebrow: "Learn",
    title,
    body,
    points: points.filter(Boolean),
    phase: phase ?? "learn",
  };
}

function assignVocabLessons(vocab: VocabItem[], budget: number, plan: LessonSpec[]): number[] {
  const caps = plan.map((spec) =>
    spec.role === "introduction" ? budget : spec.role === "review" ? 0 : Math.min(2, budget),
  );
  const counts = plan.map(() => 0);
  return vocab.map(() => {
    const slot = counts.findIndex((count, index) => count < (caps[index] ?? 0));
    const lessonNumber = slot >= 0 ? slot + 1 : plan.length;
    if (slot >= 0) counts[slot] += 1;
    return lessonNumber;
  });
}

function vocabForLesson(
  vocab: VocabItem[],
  introAt: number[],
  number: number,
  recycleCount: number,
): { fresh: VocabItem[]; recycled: VocabItem[] } {
  const fresh = vocab.filter((_, index) => introAt[index] === number);
  const previously = vocab.filter((_, index) => (introAt[index] ?? 99) < number);
  const recycled = rotateItems(previously, Math.max(0, number - 2) * 3).slice(0, recycleCount);
  return { fresh, recycled };
}

function primaryConcept(concepts: GrammarConcept[], number: number): GrammarConcept | undefined {
  if (!concepts.length) return undefined;
  if (concepts.length === 1) return concepts[0];
  if (number <= 5) return concepts[0];
  if (number <= 12) return concepts[1] ?? concepts[0];
  return concepts[0];
}

function conceptIdsFor(concepts: GrammarConcept[], number: number, role: LessonRole): string[] {
  if (!concepts.length) return [];
  if (role === "review" || number >= 13) return concepts.map((item) => item.id);
  const primary = primaryConcept(concepts, number);
  return primary ? [primary.id] : [];
}

function categoryForItem(item: VocabItem, concept?: GrammarConcept): ErrorCategory {
  if (concept?.id === "sein-present" || /^(ich bin|du bist)/i.test(item.de)) return "verb-conjugation";
  if (getArticle(item.de)) return "noun-gender";
  return "vocabulary";
}

const SEIN_FORMS = ["bin", "bist", "ist", "sind", "seid"];

function gapOptions(answer: string, pool: string[], seed: string): string[] {
  const needle = normalizeAnswer(answer);
  if (SEIN_FORMS.includes(needle)) {
    return seededShuffle(
      SEIN_FORMS.map((form) => (form === needle ? answer : form)),
      seed,
    );
  }
  const short = pool.filter((item) => {
    if (normalizeAnswer(item) === needle) return false;
    return item.split(/\s+/).length <= 2 && item.length < 16;
  });
  const distractors = pickDistractors(
    short.length >= 3 ? short : pool,
    answer,
    3,
    seed,
  ).filter((item) => normalizeAnswer(item) !== needle);
  return seededShuffle(uniqueWords([answer, ...distractors]).slice(0, 4), seed);
}

function blankToken(sentence: string): { sentence: string; answer: string } | null {
  const tokens = splitGerman(sentence).filter((token) => !/^[.,!?]$/.test(token));
  const grammar = tokens.find((token) =>
    /^(bin|bist|ist|sind|seid|habe|hast|hat|haben|war|hatte|kann|muss|will|soll|darf|möchte|weil|dass|wenn|obwohl|den|dem|einen|einem|wird|wurde|wäre|hätte|würde|könnte)$/i.test(
      token,
    ),
  );
  const hole = grammar ?? tokens[Math.min(1, tokens.length - 1)];
  if (!hole) return null;
  return { sentence: sentence.replace(hole, "___"), answer: hole };
}

function makeTeaching(args: {
  spec: LessonSpec;
  number: number;
  source: ChapterSource;
  concept?: GrammarConcept;
  fresh: VocabItem[];
  recycled: VocabItem[];
  phrases: Phrase[];
  sentences: { de: string; en: string }[];
  readings: Reading[];
  writings: WritingPrompt[];
  nouns: VocabItem[];
  hideForms: boolean;
  showForms: boolean;
  used: UsedBank;
  selectedReading?: Reading;
}): TeachCard[] {
  const {
    spec,
    number,
    source,
    concept,
    fresh,
    recycled,
    sentences,
    readings,
    writings,
    nouns,
    hideForms,
    showForms,
    used,
    selectedReading,
  } = args;
  const cards: TeachCard[] = [];
  const examplePool = uniquePairs([...(concept?.examples ?? []), ...sentences]);
  const rotatedExamples = rotateItems(examplePool, (number - 1) * 6);
  const examples = rotatedExamples.slice(0, 6);
  const learnWords = fresh.length ? fresh : recycled.slice(0, 8);

  if (spec.role === "introduction" && !hideForms) {
    if (showForms && concept?.forms?.length) {
      cards.push(
        listCard(
          "teach-learn",
          "Learn",
          concept.title,
          concept.forms,
          "Say each form aloud. Tap a line if you need the English.",
          "learn",
        ),
      );
    } else if (learnWords.length) {
      cards.push(
        listCard(
          "teach-learn",
          "Learn",
          "New words for this lesson",
          vocabRows(learnWords),
          "A small set on purpose. These will come back in later lessons.",
          "learn",
        ),
      );
    }
    if (examples.length) {
      cards.push(
        listCard(
          "teach-understand",
          "Understand",
          "See the forms in a sentence",
          sentenceRows(examples.slice(0, 6)),
          "Read the German first. Tap a line if you need the English.",
          "understand",
        ),
      );
    }
    if (concept?.commonMistakes.length) {
      cards.push(
        grammarCard("teach-mistakes", "Common mistakes", concept.commonMistakes, undefined, "learn"),
      );
    } else if (source.grammar.length) {
      cards.push(grammarCard("teach-grammar", "A rule to keep in mind", source.grammar.slice(0, 3), source.blurb));
    }
  }

  if (spec.focus === "controlled-practice") {
    cards.push(
      listCard(
        "teach-models",
        "Understand",
        "Read the full sentence before a word goes missing",
        sentenceRows(examples.slice(0, 6)),
        "Read the German. Tap a line if you need the English. Next, one piece is missing.",
        "understand",
      ),
    );
    if (nouns.length && (concept?.id === "articles-gender" || spec.skill === "grammar")) {
      cards.push(
        listCard(
          "teach-nouns",
          "Learn",
          "Keep the article with the noun",
          vocabRows(nouns.slice(0, 8)),
          undefined,
          "learn",
        ),
      );
    }
  }

  if (
    (spec.focus === "recall" || (spec.role === "practice" && hideForms)) &&
    spec.skill !== "listening" &&
    spec.skill !== "speaking" &&
    spec.skill !== "reading"
  ) {
    if (concept?.forms?.length) {
      cards.push(
        listCard(
          "teach-recall-cues",
          "Recall",
          "The table is hidden",
          concept.forms,
          "Say the German from the English. Tap a line only to check.",
          "recall",
        ),
      );
    } else {
      cards.push(
        listCard(
          "teach-recall-v",
          "Recall",
          "From memory",
          vocabRows((fresh.length ? fresh : recycled).slice(0, 8)),
          "Say the German from the English. Tap a line only to check.",
          "recall",
        ),
      );
    }
  }

  if (spec.role === "application") {
    const writing =
      writings.find((item) => !used.prompts.has(normalizeAnswer(item.prompt))) ??
      writings[(number - 1) % Math.max(writings.length, 1)] ??
      writings[0];
    cards.push({
      id: "teach-apply",
      kind: spec.skill === "speaking" ? "situation" : "model",
      eyebrow: spec.skill === "speaking" ? "Situation" : "Application",
      phase: "application",
      title: concept?.applicationPrompt ?? writing?.prompt ?? "Write a few sentences",
      titleDe: concept?.applicationPromptDe ?? writing?.promptDe,
      body:
        spec.skill === "speaking"
          ? "You are in the scene. Hear the other person, then answer. English is a last resort."
          : "Study the model here. The next step hides it so you write from memory.",
      points: writing?.hints ?? concept?.commonMistakes.slice(0, 3),
      speak: concept?.applicationSample ?? writing?.sample,
    });
  }

  if (spec.role === "review" && spec.skill !== "listening") {
    const reviewWords = uniqueWords(
      [...recycled, ...fresh].map((item) => item.de),
    ).length
      ? [...recycled.slice(0, 8), ...fresh.slice(0, 4)]
      : learnWords;
    if (reviewWords.length) {
      cards.push(
        listCard(
          "teach-review-v",
          "Review",
          "Words that should already feel familiar",
          vocabRows(reviewWords.slice(0, 8)),
          "Tap a line if you need the meaning. The quiz will also ask you to produce German.",
          "review",
        ),
      );
    }
    if (source.grammar.length) {
      cards.push(grammarCard("teach-review-g", "Rules to reuse", source.grammar.slice(0, 5), undefined, "review"));
    }
  }

  if (spec.skill === "reading" && !(spec.role === "introduction" && number === 1)) {
    const selected = selectedReading ?? readings[0];
    if (selected) {
      cards.unshift(
        readingCard(
          "teach-passage",
          selected,
          spec.focus === "review"
            ? "Read twice, listen once, then try the questions."
            : "Read for meaning first. Translation is for study, not a substitute for the German.",
        ),
      );
    }
  }

  if (spec.skill === "listening") {
    cards.push({
      id: "teach-listen-brief",
      kind: "situation",
      eyebrow: spec.role === "review" ? "Prüfung" : "Szene",
      phase: "understand",
      title: spec.role === "review" ? "Nur zweimal hören" : "Die Szene hören",
      titleDe: spec.role === "review" ? "Wie in der Prüfung" : "Zuerst hören, dann antworten",
      body:
        spec.role === "review"
          ? "A short connected text. Two plays. Questions in German. No phrase list beforehand — that would not be the exam."
          : "You will hear a short stretch of German, then answer in German. Two plays, like the exam room.",
      points: [
        "Fragen auf Deutsch.",
        "Zweimal abspielen, dann aus dem Gedächtnis.",
        "Englisch bleibt versteckt.",
      ],
    });
  }

  if (spec.role === "introduction" && source.skill === "reading" && readings[0] && number === 1) {
    if (!cards.some((card) => card.kind === "reading")) {
      cards.splice(
        Math.min(1, cards.length),
        0,
        readingCard(
          "teach-read",
          readings[0],
          "A short text after the new words. Listen once, then show English only if you need it.",
        ),
      );
    }
  }

  const filtered = cards.filter(
    (card) =>
      (card.rows && card.rows.length > 0) ||
      (card.points && card.points.length > 0) ||
      Boolean(card.body || card.translation || card.speak),
  );
  return filtered.length
    ? filtered
    : [
        listCard(
          "teach-core",
          "Learn",
          "Learn these words first",
          vocabRows(learnWords.slice(0, 8)),
          undefined,
          "learn",
        ),
      ];
}

function capRecognition(exercises: Exercise[], maxMc: number): Exercise[] {
  let mcCount = 0;
  return exercises.filter((exercise) => {
    if (exercise.type !== "multiple-choice" && exercise.type !== "listen-choice") return true;
    mcCount += 1;
    return mcCount <= maxMc;
  });
}

function makeExercises(args: {
  spec: LessonSpec;
  number: number;
  levelId: LevelId;
  source: ChapterSource;
  concept?: GrammarConcept;
  fresh: VocabItem[];
  recycled: VocabItem[];
  vocab: VocabItem[];
  phrases: Phrase[];
  sentences: { de: string; en: string }[];
  readings: Reading[];
  writings: WritingPrompt[];
  nouns: VocabItem[];
  seed: string;
  used: UsedBank;
  introduced: VocabItem[];
  drillForms: boolean;
  selectedReading?: Reading;
}): { exercises: Exercise[]; passage?: Lesson["passage"]; grammarNote?: string } {
  const {
    spec,
    number,
    levelId,
    source,
    concept,
    fresh,
    recycled,
    vocab,
    phrases,
    sentences,
    readings,
    writings,
    nouns,
    seed,
    used,
    introduced,
    drillForms,
    selectedReading,
  } = args;
  const exercises: Exercise[] = [];
  const lessonVocab = [...fresh, ...recycled];
  const pool = lessonVocab.length ? lessonVocab : vocab.slice(0, 12);
  const vocabDe = vocab.map(displayWord);
  const vocabEn = vocab.map((item) => item.en);
  const allDe = uniqueWords([...vocabDe, ...phrases.map((item) => item.de), ...sentences.map((item) => item.de)]);
  const metaBase = {
    conceptId: concept?.id,
  };
  const isA1 = levelId === "a1";
  const maxItems = isA1 ? 16 : 20;
  const examCheck = spec.title === "Chapter exam" || spec.title === "Situation check";
  const reuse = spec.role === "review" || spec.focus === "review" || examCheck;
  const allModels = uniquePairs([...(concept?.examples ?? []), ...sentences]);
  const models = reuse
    ? seededShuffle(allModels, `${seed}-models`)
    : rotateItems(allModels, (number - 1) * 5);
  const forms = concept?.forms ?? [];

  function covers(value: string): boolean {
    const needle = value.trim().toLowerCase();
    if (!needle) return false;
    return exercises.some((exercise) => {
      if (exercise.target?.toLowerCase() === needle) return true;
      if ("speak" in exercise && exercise.speak?.toLowerCase() === needle) return true;
      return false;
    });
  }

  function remember(exercise: Exercise, extra: string[] = []) {
    const keys = [
      exercise.target,
      "speak" in exercise ? exercise.speak : undefined,
      "sentence" in exercise ? exercise.sentence : undefined,
      ...extra,
    ];
    for (const key of keys) {
      if (key) used.keys.add(`${exercise.type}:${normalizeAnswer(String(key))}`);
    }
    const articleGap =
      exercise.type === "fill-blank" && Boolean(exercise.sentence?.trim().startsWith("___"));
    const wordish =
      exercise.type === "type-answer" ||
      exercise.type === "multiple-choice" ||
      exercise.type === "matching" ||
      articleGap;
    if (wordish && exercise.target) used.words.add(lemmaOf(exercise.target));
    if ("speak" in exercise && exercise.speak && splitGerman(exercise.speak).length >= 3) {
      used.sentences.add(normalizeAnswer(exercise.speak));
    }
    if (exercise.type === "drag-order") {
      used.sentences.add(normalizeAnswer(exercise.answer.join(" ")));
    }
    for (const item of extra) {
      if (splitGerman(item).length >= 3) used.sentences.add(normalizeAnswer(item));
    }
  }

  function takeFresh<T>(
    items: T[],
    count: number,
    type: string,
    keyOf: (item: T) => string,
    kind: "word" | "sentence" = "word",
  ): T[] {
    const rotated = rotateItems(items, (number - 1) * 5);
    const picked: T[] = [];
    const seen = new Set<string>();
    const consider = (allowUsed: boolean) => {
      for (const item of rotated) {
        if (picked.length >= count) break;
        const key = keyOf(item);
        if (!key) continue;
        const fp = `${type}:${normalizeAnswer(key)}`;
        if (seen.has(fp) || covers(key)) continue;
        if (!allowUsed) {
          if (used.keys.has(fp)) continue;
          if (kind === "word" && used.words.has(lemmaOf(key))) continue;
        }
        seen.add(fp);
        picked.push(item);
      }
    };
    consider(false);
    if (reuse && picked.length < count) consider(true);
    return picked;
  }

  function addRecognition(items: VocabItem[], count: number) {
    takeFresh(items, count, "multiple-choice", (item) => item.de).forEach((item, i) => {
      const exercise = tag(
        mc(
          makeId("rec", exercises.length + i),
          `What does “${item.de}” mean?`,
          item.en,
          vocabEn,
          `${seed}-r-${i}`,
          { speak: item.de, explain: `${item.de} = ${item.en}`, promptDe: `Was bedeutet „${item.de}“?` },
        ),
        {
          ...metaBase,
          phase: "learn",
          target: item.de,
          errorCategory: categoryForItem(item, concept),
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addRecall(items: VocabItem[], count: number) {
    takeFresh(items, count, "type-answer", (item) => item.de).forEach((item, i) => {
      const exercise = tag(
        {
          type: "type-answer",
          id: makeId("recall", exercises.length + i),
          prompt: `Type the German for “${item.en}”.`,
          promptDe: `Wie sagt man „${item.en}“ auf Deutsch?`,
          answer: uniqueWords([item.de, stripArticle(item.de)]),
          hint: item.hint ?? (getArticle(item.de) ? `Article: ${getArticle(item.de)}` : undefined),
          speak: item.de,
        },
        {
          ...metaBase,
          modality: "recall",
          phase: "recall",
          target: item.de,
          errorCategory: categoryForItem(item, concept),
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addFormRecall(count: number) {
    takeFresh(forms, count, "type-answer", (row) => row.de).forEach((row, i) => {
      const exercise = tag(
        {
          type: "type-answer",
          id: makeId("form", i),
          prompt: `Type the German for “${row.en}”.`,
          promptDe: `Wie sagt man „${row.en}“?`,
          answer: uniqueWords([row.de, row.de.replace("/", " "), row.de.split("/")[0]?.trim() ?? row.de]),
          speak: row.de,
        },
        {
          ...metaBase,
          modality: "recall",
          phase: "recall",
          target: row.de,
          errorCategory: concept?.id === "sein-present" ? "verb-conjugation" : "other",
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addCompletion(items: { de: string; en: string }[], count: number) {
    takeFresh(items, count, "fill-blank", (item) => item.de, "sentence").forEach((item, i) => {
      const gap = blankToken(item.de);
      if (!gap) return;
      const exercise = tag(
        {
          type: "fill-blank",
          id: makeId("gap", exercises.length + i),
          prompt: "Fill in the missing German word.",
          promptDe: "Ergänze den Satz.",
          sentence: gap.sentence,
          answer: [gap.answer, gap.answer.replace(/^[A-ZÄÖÜ]/, (c) => c.toLowerCase())],
          hint: item.en,
          speak: item.de,
          options: gapOptions(gap.answer, allDe, `${seed}-gap-${i}`),
        },
        {
          ...metaBase,
          modality: "completion",
          phase: "controlled-practice",
          target: gap.answer,
          errorCategory: /bin|bist|ist/.test(gap.answer) ? "verb-conjugation" : "other",
        },
      );
      exercises.push(exercise);
      remember(exercise, [item.de, gap.sentence]);
    });
  }

  function addArticles(count: number) {
    const articleNouns = reuse
      ? nouns
      : nouns.filter(
          (item) =>
            introduced.some((entry) => entry.de === item.de) ||
            fresh.some((entry) => entry.de === item.de) ||
            recycled.some((entry) => entry.de === item.de),
        );
    takeFresh(
      articleNouns.filter((item) => Boolean(getArticle(item.de))),
      count,
      "fill-blank",
      (item) => item.de,
    ).forEach((item, i) => {
      const article = getArticle(item.de);
      if (!article) return;
      const exercise = tag(
        {
          type: "fill-blank",
          id: makeId("art", i),
          prompt: "Which article fits: der, die, or das?",
          promptDe: "Welcher Artikel passt?",
          sentence: `___ ${stripArticle(item.de)}`,
          answer: article,
          options: seededShuffle(["der", "die", "das"], `${seed}-a-${i}`),
          hint: item.en,
          speak: item.de,
        },
        {
          ...metaBase,
          modality: "completion",
          phase: "controlled-practice",
          target: item.de,
          errorCategory: "noun-gender",
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addConstruction(items: { de: string; en: string }[], count: number) {
    takeFresh(items, count, "drag-order", (item) => item.de, "sentence").forEach((item, i) => {
      const words = splitGermanWords(item.de);
      const exercise = tag(
        {
          type: "drag-order",
          id: makeId("order", exercises.length + i),
          prompt: "Put the German words in the right order.",
          promptDe: "Bring die Wörter in die richtige Reihenfolge.",
          words: seededShuffle(words, `${seed}-w-${i}`),
          answer: words,
          translation: item.en,
          speak: item.de,
        },
        {
          ...metaBase,
          modality: "construction",
          phase: spec.focus === "application" ? "application" : "controlled-practice",
          target: item.de,
          errorCategory: "word-order",
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addTranslation(items: { de: string; en: string }[], count: number) {
    takeFresh(items, count, "type-answer", (item) => item.de, "sentence").forEach((item, i) => {
      const exercise = tag(
        {
          type: "type-answer",
          id: makeId("tr", exercises.length + i),
          prompt: `Type this in German: “${item.en}”`,
          promptDe: `Schreib auf Deutsch: „${item.en}“`,
          answer: [item.de, item.de.replace(/[.!?]/g, "").trim()],
          speak: item.de,
        },
        {
          ...metaBase,
          modality: "translation",
          phase: spec.role === "application" ? "application" : "recall",
          target: item.de,
          errorCategory: "vocabulary",
        },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function addProduction() {
    const unusedWriting = writings.find((item) => !used.prompts.has(normalizeAnswer(item.prompt)));
    const writing = unusedWriting ?? writings[(number - 1) % Math.max(writings.length, 1)];
    const conceptPrompt = concept?.applicationPrompt;
    const canUseConcept =
      Boolean(conceptPrompt) && !used.prompts.has(normalizeAnswer(conceptPrompt ?? ""));
    const phrase = rotateItems(phrases, number)[0];
    const freshBits = fresh.map((item) => item.de).slice(0, 3).join(", ");
    let prompt = writing?.prompt ?? "Write 2–3 German sentences about this topic.";
    let promptDe = writing?.promptDe ?? "Schreib 2–3 Sätze auf Deutsch.";
    let sample = writing?.sample ?? models[0]?.de ?? "";
    let keywords = writing?.hints?.filter((hint) => hint.trim().split(/\s+/).length <= 2).slice(0, 3);
    let hints = writing?.hints;
    if (canUseConcept && spec.role === "application" && number <= 5) {
      prompt = conceptPrompt ?? prompt;
      promptDe = concept?.applicationPromptDe ?? promptDe;
      sample = concept?.applicationSample ?? sample;
      keywords = concept?.applicationKeywords ?? keywords;
    } else if (!unusedWriting) {
      if (freshBits) {
        prompt = `Write 2–3 German sentences using: ${freshBits}.`;
        promptDe = "Schreib 2–3 Sätze mit diesen Wörtern.";
        keywords = fresh.slice(0, 3).map((item) => stripArticle(item.de));
      } else if (phrase) {
        prompt = `Reply in German to: “${phrase.en}”`;
        promptDe = `Antworte auf Deutsch: „${phrase.de}“`;
        sample = phrase.de;
        keywords = phrase.de.split(/\s+/).filter((word) => word.length > 3).slice(0, 3);
      }
    }
    used.prompts.add(normalizeAnswer(prompt));
    const exercise = tag(
      {
        type: "free-production",
        id: "produce",
        prompt,
        promptDe,
        sample,
        keywords,
        minSentences: 2,
        hints,
        rubric: {
          ...rubricFor(levelId, source.slug, writing),
          keywords: keywords?.slice(0, 4),
        },
      },
      {
        ...metaBase,
        modality: "production",
        phase: "application",
        target: concept?.title ?? "production",
        errorCategory: "other",
      },
    );
    exercises.push(exercise);
    remember(exercise);
  }

  function addMatching(items: VocabItem[], count: number) {
    const chosen = takeFresh(items, count, "matching", (item) => item.de);
    const pairs = chosen.map((item) => ({ left: item.de, right: item.en }));
    if (pairs.length < 3) return;
    const exercise = tag(
      {
        type: "matching",
        id: makeId("match", exercises.length),
        prompt: "Match the German with the English meaning.",
        promptDe: "Ordne Deutsch und Bedeutung.",
        pairs,
      },
      { ...metaBase, modality: "recognition", phase: "learn", errorCategory: "vocabulary" },
    );
    exercises.push(exercise);
    remember(exercise, chosen.map((item) => item.de));
  }

  function addSpeaking() {
    exercises.push(
      tag(speakingPrompt(writings, phrases, seed), {
        ...metaBase,
        target: concept?.title ?? "speaking",
      }),
    );
    const dialogue =
      conversationDialogue(levelId, seed) ??
      dialogueFromPhrases(source.title, source.titleDe, phrases, seed);
    if (dialogue) exercises.push(tag(dialogue, { ...metaBase }));
  }

  const extras = extraReadings(levelId);
  let passage: Lesson["passage"];
  let grammarNote: string | undefined = source.grammar[0];

  const vocabIntro = spec.skill === "vocab" && spec.role === "introduction";
  if (vocabIntro) {
    addMatching(fresh.length ? fresh : pool, 6);
    addRecall(fresh.length ? fresh : pool, 8);
    addArticles(isA1 ? 4 : 6);
  } else if (spec.focus === "learn" || spec.role === "introduction") {
    if (forms.length && drillForms) addCompletion(models, 6);
    else {
      addCompletion(models, 4);
      addRecognition(fresh.length ? fresh : pool, isA1 ? 2 : 4);
      if (fresh.length) addRecall(fresh, 6);
    }
    if (number === 1 && readings[0] && source.skill === "reading") {
      passage = {
        title: readings[0].title,
        titleDe: readings[0].titleDe,
        text: readings[0].text,
        translation: readings[0].translation,
      };
    }
  } else if (spec.focus === "controlled-practice") {
    addCompletion(models, 6);
    addArticles(isA1 ? 4 : 6);
    addConstruction(models, 4);
  } else if (
    spec.focus === "recall" &&
    spec.skill !== "listening" &&
    spec.skill !== "reading" &&
    spec.skill !== "speaking"
  ) {
    if (forms.length) addFormRecall(Math.min(6, forms.length));
    addRecall(pool, 6);
    addTranslation(models, 2);
  } else if (spec.role === "application" && spec.skill === "speaking") {
    addSpeaking();
    addProduction();
  } else if (spec.role === "application") {
    addTranslation(models, levelId === "c1" || levelId === "b2" ? 3 : 4);
    addConstruction(models, 2);
    addProduction();
    if (levelId === "a2" || levelId === "b1") {
      exercises.push(
        tag(speakingPrompt(writings, phrases, `${seed}-sp`), {
          ...metaBase,
          target: "speaking",
        }),
      );
    }
  } else if (
    spec.focus === "review" &&
    spec.skill !== "listening" &&
    spec.skill !== "reading" &&
    !examCheck
  ) {
    addMatching(pool, 6);
    addRecall(pool, 4);
    addCompletion(models, 2);
    addConstruction(sentences, 2);
    addTranslation(models, 2);
  }

  if (spec.skill === "listening") {
    const script = composeListenScript(phrases, sentences, number, used);
    connectedListening(script, undefined, seed, spec.role === "review" ? 5 : 4).forEach((item) => {
      exercises.push(tag(item, { ...metaBase }));
    });
  }

  if (spec.skill === "speaking" && spec.role !== "application") {
    addSpeaking();
  }

  if (spec.skill === "reading" && !(spec.role === "introduction" && number === 1)) {
    const examText = spec.focus === "review" || spec.title.startsWith("Exam-length");
    const selected =
      selectedReading ??
      pickUnusedReading(
        examText ? [] : readings,
        extras,
        used,
        examText ? `${seed}-read` : `${seed}-pass`,
      ) ??
      pickUnusedReading(readings, extras, used, `${seed}-pass`);
    if (selected) {
      passage = {
        title: selected.title,
        titleDe: selected.titleDe,
        text: selected.text,
        translation: selected.translation,
      };
      germanReadingItems(selected, seed, examText ? 6 : 4).forEach((item) => {
        exercises.push(tag(item, { ...metaBase }));
      });
      const snippet = selected.text.split(/[.!?]/)[0]?.trim();
      if (snippet && spec.focus !== "understand") {
        exercises.push(
          tag(
            {
              type: "type-answer",
              id: "copy-sense",
              prompt: "Type the first sentence from the text.",
              promptDe: "Schreib den ersten Satz aus dem Text.",
              answer: uniqueWords([snippet, `${snippet}.`]),
              speak: snippet,
            },
            { ...metaBase, modality: "recall", phase: "recall", target: snippet, errorCategory: "vocabulary" },
          ),
        );
        remember(exercises[exercises.length - 1]);
        const words = splitGermanWords(snippet);
        exercises.push(
          tag(
            {
              type: "drag-order",
              id: "rebuild-line",
              prompt: "Rebuild the first line in German.",
              promptDe: "Bau die erste Zeile wieder zusammen.",
              words: seededShuffle(words, `${seed}-line`),
              answer: words,
              speak: snippet,
            },
            { ...metaBase, modality: "construction", phase: "controlled-practice", target: snippet, errorCategory: "word-order" },
          ),
        );
        remember(exercises[exercises.length - 1]);
      }
    }
  }

  if (examCheck) {
    addRecall(seededShuffle(introduced.length ? introduced : vocab, `${seed}-q`).slice(0, 4), 4);
    addConstruction(seededShuffle(sentences, `${seed}-qs`).slice(0, 2), 2);
    const quizReading =
      pickUnusedReading([], extras, used, `${seed}-exam`) ?? longReading(levelId, `${seed}-exam`);
    if (quizReading.text) used.passages.add(normalizeAnswer(quizReading.text));
    passage = {
      title: quizReading.title,
      titleDe: quizReading.titleDe,
      text: quizReading.text,
      translation: quizReading.translation,
    };
    germanReadingItems(quizReading, `${seed}-eq`, 3).forEach((item) => {
      exercises.push(tag(item, { ...metaBase, phase: "review" }));
    });
    const script = composeListenScript(phrases, sentences, number + 7, used);
    connectedListening(script, undefined, `${seed}-el`, 2).forEach((item) => {
      exercises.push(tag(item, { ...metaBase }));
    });
    if (levelId !== "a1") addSpeaking();
    addProduction();
  }

  if (spec.skill === "vocab" && spec.role === "practice" && spec.focus === "recall" && phrases.length) {
    takeFresh(phrases, 6, "type-answer", (item) => item.de, "sentence").forEach((item, i) => {
      const exercise = tag(
        {
          type: "type-answer",
          id: makeId("ph-type", i),
          prompt: `Type this in German: “${item.en}”`,
          promptDe: `Schreib auf Deutsch: „${item.en}“`,
          answer: [item.de, item.de.replace(/[!?]/g, "").trim()],
          hint: item.note ?? item.de.split(" ")[0],
          speak: item.de,
        },
        { ...metaBase, modality: "recall", phase: "recall", target: item.de, errorCategory: "vocabulary" },
      );
      exercises.push(exercise);
      remember(exercise);
    });
  }

  function keepValid(items: Exercise[]): Exercise[] {
    return items.filter((exercise) => {
      if (exercise.type === "matching") return exercise.pairs.length >= 3;
      if (exercise.type === "drag-order") return exercise.answer.length > 1;
      if (exercise.type === "fill-blank") return Boolean(exercise.answer);
      if (exercise.type === "free-production") return Boolean(exercise.sample || exercise.prompt);
      if (exercise.type === "speak-response") return Boolean(exercise.sample);
      if (exercise.type === "dialogue") return exercise.turns.length >= 2;
      if (exercise.type === "listen-comprehension") return Boolean(exercise.speak && exercise.answer);
      return true;
    });
  }

  function padQuiz() {
    if (spec.skill === "speaking" || spec.skill === "listening" || spec.skill === "reading") return;
    const minItems = isA1 ? 10 : 12;
    const remaining = () => {
      if (exercises.length >= maxItems) return 0;
      const target = exercises.length >= minItems ? exercises.length : minItems;
      return Math.max(0, Math.min(maxItems, target) - exercises.length);
    };
    if (!remaining()) return;
    const unusedVocab = [...fresh, ...recycled, ...introduced].filter(
      (item, index, list) =>
        list.findIndex((entry) => entry.de === item.de) === index &&
        !covers(item.de) &&
        (reuse || !used.words.has(lemmaOf(item.de))),
    );
    const unusedSentences = uniquePairs(sentences).filter((item) => !covers(item.de));
    if (spec.role === "introduction" || spec.focus === "recall" || spec.skill === "vocab") {
      if (remaining()) addRecall(unusedVocab, remaining());
    }
    if (remaining()) addTranslation(unusedSentences, remaining());
    if (remaining()) addCompletion(unusedSentences, remaining());
    if (remaining()) addConstruction(unusedSentences, remaining());
    if (remaining()) addArticles(remaining());
    if (remaining()) addRecall(unusedVocab, remaining());
  }

  padQuiz();
  const maxMc = spec.skill === "reading" || examCheck ? 8 : isA1 ? 4 : 6;
  const limited = capRecognition(keepValid(exercises), maxMc);
  exercises.length = 0;
  exercises.push(...limited);
  padQuiz();
  return { exercises: keepValid(exercises).slice(0, maxItems), passage, grammarNote };
}

function attachLessonRefs(concepts: GrammarConcept[], lessons: Lesson[]): GrammarConcept[] {
  return concepts.map((concept) => {
    const tagged = lessons.filter((lesson) => lesson.conceptIds.includes(concept.id));
    const ref = (lesson: Lesson) => ({
      lessonId: lesson.id,
      number: lesson.number,
      title: lesson.title,
    });
    const intro = tagged.find((lesson) => lesson.role === "introduction") ?? tagged[0];
    return {
      ...concept,
      introductionLesson: intro ? ref(intro) : undefined,
      practiceLessons: tagged.filter((lesson) => lesson.role === "practice").map(ref),
      reviewLessons: tagged.filter((lesson) => lesson.role === "review").map(ref),
    };
  });
}

function roleSummary(
  spec: LessonSpec,
  source: ChapterSource,
  concept: GrammarConcept | undefined,
  levelId: LevelId,
): string {
  const topic = concept?.title ?? source.title;
  if (spec.skill === "listening") {
    return `${topic}: connected speech, twice only, questions in German.`;
  }
  if (spec.skill === "speaking") {
    return `${topic}: a situation. Listen, answer, keep the conversation going.`;
  }
  if (spec.title.startsWith("Exam-length") || spec.title === "Chapter exam") {
    return levelId === "a1"
      ? `${topic}: exam-shaped reading, listening, and writing.`
      : `${topic}: exam-shaped reading, listening, writing, and a spoken turn.`;
  }
  if (spec.role === "introduction") {
    return `${topic}: learn the forms, read examples, then a little controlled practice.`;
  }
  if (spec.focus === "controlled-practice") {
    return `${topic}: complete the missing pieces while the model is still fresh.`;
  }
  if (spec.focus === "recall") {
    return `${topic}: the table stays hidden. Produce the German from meaning.`;
  }
  if (spec.role === "application") {
    return levelId === "a1"
      ? `${topic}: write a real reply, not only a gap.`
      : `${topic}: write, then speak — a real reply, not only a gap.`;
  }
  return `${topic}: mix recognition and recall, including words from earlier lessons.`;
}

function withoutSpokenProduction(exercises: Exercise[]): Exercise[] {
  return exercises.filter(
    (exercise) => exercise.type !== "speak-response" && exercise.type !== "dialogue",
  );
}

function spokenReply(
  id: string,
  prompt: string,
  promptDe: string,
  sample: string,
  keywords: string[],
  conceptId?: string,
): Exercise {
  return {
    type: "speak-response",
    id,
    prompt,
    promptDe,
    sample,
    speak: sample,
    keywords: keywords.filter(Boolean).slice(0, 4),
    situation: "The other person is waiting. Answer in full sentences, not one word.",
    situationDe: "Jemand wartet. Antworte in ganzen Sätzen, nicht mit einem Wort.",
    minSeconds: 4,
    modality: "production",
    phase: "application",
    errorCategory: "other",
    conceptId,
  };
}

function buildA1SpeakingLesson(
  source: ChapterSource,
  concepts: GrammarConcept[],
  number: number,
  seed: string,
): Lesson {
  const concept = concepts[0];
  const topic = source.title.split(/[&·]/)[0]?.trim() ?? source.title;
  const topicDe = source.titleDe.split(/und|,/)[0]?.trim() ?? source.titleDe;
  const seen = new Set<string>();
  const exercises: Exercise[] = [];

  function takeSample(value: string): boolean {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  source.writings.forEach((writing, index) => {
    if (!takeSample(writing.sample)) return;
    exercises.push(
      spokenReply(
        `speak-${index + 1}`,
        writing.prompt,
        writing.promptDe,
        writing.sample,
        writing.hints,
        concept?.id,
      ),
    );
  });

  source.phrases.forEach((phrase, index) => {
    if (exercises.filter((item) => item.type === "speak-response").length >= 4) return;
    if (!takeSample(phrase.de)) return;
    exercises.push(
      spokenReply(
        `speak-line-${index + 1}`,
        `Say this in German: “${phrase.en}”`,
        `Sag auf Deutsch: „${phrase.en}“`,
        phrase.de,
        phrase.de.split(/\s+/).filter((word) => word.length > 2),
        concept?.id,
      ),
    );
  });

  const dialogue =
    dialogueFromPhrases(source.title, source.titleDe, source.phrases, seed) ??
    conversationDialogue("a1", seed);
  if (dialogue) exercises.push({ ...dialogue, conceptId: concept?.id });

  const lineRows = source.phrases.slice(0, 6).map((item) => ({ de: item.de, en: item.en }));
  const teaching: TeachCard[] = [
    {
      id: "teach-speak-optional",
      kind: "situation",
      eyebrow: "Optional",
      phase: "application",
      title: "Speaking exercises",
      titleDe: "Sprechübungen",
      body: "This lesson is optional. Hear the other person, then answer in full sentences. You can finish the chapter without a microphone.",
      points: [
        "Ganze Sätze, nicht nur ein Wort.",
        "Englisch nur zur Kontrolle.",
        "Tippen geht, wenn das Mikrofon nicht mitmacht.",
      ],
    },
  ];
  if (lineRows.length) {
    teaching.push(
      listCard(
        "teach-speak-lines",
        "Application",
        "Lines you can say",
        lineRows,
        "Listen, then say them yourself. English is a last resort.",
        "application",
      ),
    );
  }

  const filled = exercises.filter((exercise) => {
    if (exercise.type === "speak-response") return Boolean(exercise.sample);
    if (exercise.type === "dialogue") return exercise.turns.length >= 2;
    return true;
  });

  return {
    id: "speaking",
    number,
    title: `Speaking exercises · ${topic}`,
    titleDe: `Sprechübungen · ${topicDe}`,
    skill: "speaking",
    role: "application",
    optional: true,
    summary: `${concept?.title ?? source.title}: optional speaking. A situation, a reply, and a short dialogue — not part of the required chapter path.`,
    estimatedMinutes: Math.max(10, 6 + filled.length * 2),
    conceptIds: concepts.map((item) => item.id),
    newVocab: [],
    recycledVocab: source.vocab.slice(0, 8),
    teaching,
    exercises: filled,
  };
}

function buildLessons(
  source: ChapterSource,
  levelId: LevelId,
  concepts: GrammarConcept[],
): Lesson[] {
  const vocab = source.vocab;
  const budget = VOCAB_BUDGET[levelId];
  const plan = lessonPlanFor(levelId);
  const introAt = assignVocabLessons(vocab, budget, plan);
  const nouns = nounPool(vocab);
  const recycleCount = levelId === "a1" ? 8 : 10;
  const used = emptyUsed();
  const extras = extraReadings(levelId);

  const lessons: Lesson[] = plan.map((spec, index) => {
    const number = index + 1;
    const id = String(number).padStart(2, "0");
    const seed = `${levelId}-${source.slug}-${id}`;
    const concept = primaryConcept(concepts, number);
    const { fresh, recycled } = vocabForLesson(vocab, introAt, number, recycleCount);
    const introduced = vocab.filter((_, vocabIndex) => (introAt[vocabIndex] ?? 99) <= number);
    const hideForms = spec.focus === "recall" || spec.role === "application";
    const showForms = Boolean(
      concept?.forms?.length &&
        spec.role === "introduction" &&
        spec.skill !== "vocab" &&
        !used.concepts.has(concept.id),
    );
    const drillForms = Boolean(
      concept?.forms?.length &&
        ((spec.role === "introduction" && spec.skill !== "vocab" && !used.concepts.has(concept.id)) ||
          spec.focus === "recall"),
    );
    const examText =
      spec.skill === "reading" &&
      (spec.focus === "review" || spec.title.startsWith("Exam-length"));
    const selectedReading =
      spec.skill === "reading" && !(spec.role === "introduction" && number === 1)
        ? pickUnusedReading(
            examText ? [] : source.readings,
            extras,
            used,
            examText ? `${seed}-read` : `${seed}-pass`,
          ) ?? pickUnusedReading(source.readings, extras, used, `${seed}-pass`)
        : undefined;
    const teaching = makeTeaching({
      spec,
      number,
      source,
      concept,
      fresh,
      recycled,
      phrases: source.phrases,
      sentences: source.sentences,
      readings: source.readings,
      writings: source.writings,
      nouns,
      hideForms,
      showForms,
      used,
      selectedReading,
    });
    const built = makeExercises({
      spec,
      number,
      levelId,
      source,
      concept,
      fresh,
      recycled,
      vocab,
      phrases: source.phrases,
      sentences: source.sentences,
      readings: source.readings,
      writings: source.writings,
      nouns,
      seed,
      used,
      introduced,
      drillForms,
      selectedReading,
    });
    if (concept && spec.role === "introduction" && spec.skill !== "vocab") {
      used.concepts.add(concept.id);
    }
    const filled = built.exercises.length
      ? built.exercises
      : poolFallback(fresh.length ? fresh : introduced, seed, concept);
    const exercises = levelId === "a1" ? withoutSpokenProduction(filled) : filled;
    return {
      id,
      number,
      title: `${spec.title} · ${source.title.split(/[&·]/)[0]?.trim() ?? source.title}`,
      titleDe: `${spec.titleDe} · ${source.titleDe.split(/und|,/)[0]?.trim() ?? source.titleDe}`,
      skill: spec.skill,
      role: spec.role,
      summary: roleSummary(spec, source, concept, levelId),
      estimatedMinutes:
        (8 + (exercises.length > 6 ? 3 : 0) + (teaching.length > 1 ? 3 : 2)) * 2,
      conceptIds: conceptIdsFor(concepts, number, spec.role),
      newVocab: fresh,
      recycledVocab: recycled,
      passage: built.passage,
      grammarNote: built.grammarNote,
      teaching,
      exercises,
    };
  });
  if (levelId === "a1") {
    lessons.push(
      buildA1SpeakingLesson(
        source,
        concepts,
        lessons.length + 1,
        `${levelId}-${source.slug}-speaking`,
      ),
    );
  }
  return lessons;
}

function poolFallback(vocab: VocabItem[], _seed: string, concept?: GrammarConcept): Exercise[] {
  return vocab.slice(0, 8).map((item, i) =>
    tag(
      {
        type: "type-answer",
        id: makeId("fallback", i),
        prompt: `Type the German for “${item.en}”.`,
        promptDe: `Wie sagt man „${item.en}“?`,
        answer: uniqueWords([item.de, stripArticle(item.de)]),
        speak: item.de,
      },
      {
        conceptId: concept?.id,
        modality: "recall",
        phase: "recall",
        target: item.de,
        errorCategory: "vocabulary",
      },
    ),
  );
}

export function buildChapter(source: ChapterSource, index: number, levelId: LevelId): Chapter {
  const listed = conceptsForChapter(levelId, source.slug);
  const concepts = listed.length
    ? listed
    : [fallbackConcept(levelId, source.slug, source.title, source.grammar)];
  const lessons = buildLessons(source, levelId, concepts);
  return {
    slug: source.slug,
    number: index + 1,
    title: source.title,
    titleDe: source.titleDe,
    blurb: source.blurb,
    skill: source.skill,
    grammar: source.grammar,
    vocab: source.vocab,
    concepts: attachLessonRefs(concepts, lessons),
    lessons,
  };
}

export function buildLevel(id: LevelId, sources: ChapterSource[]): Level {
  const meta = LEVEL_META[id];
  return {
    ...meta,
    color: id,
    chapters: sources.map((source, index) => buildChapter(source, index, id)),
  };
}
