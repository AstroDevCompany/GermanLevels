import { conceptsForChapter, fallbackConcept } from "@/content/concepts";
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
  pickDistractors,
  seededShuffle,
  splitGerman,
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
  { title: "Listen, then recall", titleDe: "Hören, dann erinnern", skill: "listening", role: "practice", focus: "recall" },
  { title: "Phrases from memory", titleDe: "Phrasen merken", skill: "vocab", role: "practice", focus: "recall" },
  { title: "Say the phrase", titleDe: "Die Phrase sagen", skill: "writing", role: "application", focus: "application" },
  { title: "Grammar in focus", titleDe: "Grammatik im Fokus", skill: "grammar", role: "introduction", focus: "learn" },
  { title: "Forms in gaps", titleDe: "Formen in Lücken", skill: "grammar", role: "practice", focus: "controlled-practice" },
  { title: "Read closely", titleDe: "Genau lesen", skill: "reading", role: "practice", focus: "understand" },
  { title: "Read and produce", titleDe: "Lesen und produzieren", skill: "reading", role: "practice", focus: "recall" },
  { title: "A longer look", titleDe: "Längerer Text", skill: "reading", role: "review", focus: "review" },
  { title: "Write it out", titleDe: "Schreiben", skill: "writing", role: "application", focus: "application" },
  { title: "Your own words", titleDe: "Eigene Sätze", skill: "writing", role: "application", focus: "application" },
  { title: "Sound and sense", titleDe: "Klang und Sinn", skill: "listening", role: "review", focus: "review" },
  { title: "Mixed review", titleDe: "Gemischte Wiederholung", skill: "mixed", role: "review", focus: "review" },
  { title: "Chapter check", titleDe: "Kapiteltest", skill: "mixed", role: "review", focus: "review" },
];

function displayWord(item: VocabItem): string {
  return item.de;
}

function nounPool(vocab: VocabItem[]): VocabItem[] {
  return vocab.filter((item) => Boolean(getArticle(item.de) || item.gender));
}

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
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
    promptDe: extra?.promptDe,
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

function phraseRows(items: Phrase[]): TeachRow[] {
  return items.map((item) => ({ de: item.de, en: item.en, note: item.note }));
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

function assignVocabLessons(vocab: VocabItem[], budget: number): number[] {
  const caps = LESSON_PLAN.map((spec) =>
    spec.role === "introduction" ? budget : spec.role === "review" ? 0 : Math.min(2, budget),
  );
  const counts = LESSON_PLAN.map(() => 0);
  return vocab.map(() => {
    const slot = counts.findIndex((count, index) => count < (caps[index] ?? 0));
    const lessonNumber = slot >= 0 ? slot + 1 : LESSON_PLAN.length;
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
  const core = new Set(vocab.slice(0, 8).map((item) => item.de));
  const recycled = vocab
    .filter((_, index) => (introAt[index] ?? 99) < number)
    .sort((a, b) => Number(core.has(b.de)) - Number(core.has(a.de)));
  return { fresh, recycled: recycled.slice(0, recycleCount) };
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

function gapOptions(answer: string, pool: string[], seed: string): string[] {
  const sein = ["bin", "bist", "ist", "sind", "seid"];
  if (sein.includes(answer.toLowerCase())) {
    return seededShuffle(uniqueWords([answer, ...sein.filter((item) => item !== answer.toLowerCase())]), seed).slice(0, 4);
  }
  const short = pool.filter(
    (item) => item !== answer && item.split(/\s+/).length <= 2 && item.length < 16,
  );
  return uniqueWords([
    answer,
    ...pickDistractors(short.length >= 3 ? short : pool, answer, 3, seed),
  ]);
}

function blankToken(sentence: string): { sentence: string; answer: string } | null {
  const tokens = splitGerman(sentence).filter((token) => !/^[.,!?]$/.test(token));
  const verb = tokens.find((token) =>
    /^(bin|bist|ist|sind|seid|komme|kommst|kommt|wohne|wohnst|wohnt|gehe|gehst|geht|heiße|heißt|habe|hast|hat)$/i.test(
      token,
    ),
  );
  const hole = verb ?? tokens[Math.min(1, tokens.length - 1)];
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
}): TeachCard[] {
  const {
    spec,
    number,
    source,
    concept,
    fresh,
    recycled,
    phrases,
    sentences,
    readings,
    writings,
    nouns,
    hideForms,
  } = args;
  const cards: TeachCard[] = [];
  const examples = (concept?.examples?.length ? concept.examples : sentences).slice(0, 3);
  const learnWords = fresh.length ? fresh : recycled.slice(0, 5);

  if (spec.role === "introduction" && !hideForms) {
    if (concept?.forms?.length) {
      cards.push(
        listCard(
          "teach-learn",
          "Learn",
          concept.title,
          concept.forms,
          "Say each form aloud. You will need them without looking in a later step.",
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
          sentenceRows(examples),
          "Read German first. English is there if you need it.",
          "understand",
        ),
      );
    }
    if (concept?.commonMistakes.length) {
      cards.push(
        grammarCard("teach-mistakes", "Common mistakes", concept.commonMistakes, undefined, "learn"),
      );
    } else if (source.grammar.length) {
      cards.push(grammarCard("teach-grammar", "A rule to keep in mind", source.grammar.slice(0, 2), source.blurb));
    }
  }

  if (spec.focus === "controlled-practice") {
    cards.push(
      listCard(
        "teach-models",
        "Understand",
        "Read the full sentence before a word goes missing",
        sentenceRows(examples.slice(0, 4)),
        "The next step hides one piece. Learn the shape now.",
        "understand",
      ),
    );
    if (nouns.length && (concept?.id === "articles-gender" || spec.skill === "grammar")) {
      cards.push(
        listCard(
          "teach-nouns",
          "Learn",
          "Keep the article with the noun",
          vocabRows(nouns.slice(0, 5)),
          undefined,
          "learn",
        ),
      );
    }
  }

  if (spec.focus === "recall" || (spec.role === "practice" && hideForms)) {
    if (concept?.forms?.length) {
      cards.push({
        id: "teach-recall-cues",
        kind: "grammar",
        eyebrow: "Recall",
        phase: "recall",
        title: "The table is hidden",
        body: "Produce the German from English. Looking back is the easy part; this is the useful part.",
        points: concept.forms.map((row) => row.en),
      });
    } else {
      cards.push({
        id: "teach-recall-v",
        kind: "grammar",
        eyebrow: "Recall",
        phase: "recall",
        title: "From memory",
        body: "You have already seen these. English is the prompt; German is what you produce.",
        points: (fresh.length ? fresh : recycled).slice(0, 5).map((item) => item.en),
      });
    }
  }

  if (spec.role === "application") {
    const writing = writings[number === 17 ? 1 : 0] ?? writings[0];
    cards.push({
      id: "teach-apply",
      kind: "model",
      eyebrow: "Application",
      phase: "application",
      title: concept?.applicationPrompt ?? writing?.prompt ?? "Write a few sentences",
      titleDe: concept?.applicationPromptDe ?? writing?.promptDe,
      body: "Study the model, then write without copying word for word.",
      points: writing?.hints ?? concept?.commonMistakes.slice(0, 3),
      speak: concept?.applicationSample ?? writing?.sample,
    });
  }

  if (spec.role === "review") {
    const reviewWords = uniqueWords(
      [...recycled, ...fresh].map((item) => item.de),
    ).length
      ? [...recycled.slice(0, 4), ...fresh.slice(0, 2)]
      : learnWords;
    if (reviewWords.length) {
      cards.push(
        listCard(
          "teach-review-v",
          "Review",
          "Words that should already feel familiar",
          vocabRows(reviewWords.slice(0, 5)),
          "Recognition is not enough — the quiz will also ask you to produce German.",
          "review",
        ),
      );
    }
    if (source.grammar.length) {
      cards.push(grammarCard("teach-review-g", "Rules to reuse", source.grammar.slice(0, 3), undefined, "review"));
    }
  }

  if (number === 13 || number === 14 || number === 15) {
    const selected = readings[(Math.max(0, number - 13) || 0) % readings.length] ?? readings[0];
    if (selected && (spec.skill === "reading" || number >= 13)) {
      cards.unshift(
        readingCard(
          "teach-passage",
          selected,
          number === 15
            ? "Read twice, listen once, then try the questions."
            : "Read for meaning first. Translation is for study, not a substitute for the German.",
        ),
      );
    }
  }

  if (spec.skill === "listening" && phrases.length) {
    cards.push(
      listCard(
        "teach-listen",
        "Understand",
        "Phrases you will hear",
        phraseRows(phrases.slice(0, 4)),
        "Read them now. Next you hear them without the German on screen, then you produce them.",
        "understand",
      ),
    );
  }

  if (spec.role === "introduction" && source.skill === "reading" && readings[0] && number === 1) {
    if (!cards.some((card) => card.kind === "reading")) {
      cards.splice(
        Math.min(1, cards.length),
        0,
        readingCard(
          "teach-read",
          readings[0],
          "A short text after the new words. Listen once, then reveal English only if you need it.",
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
          vocabRows(learnWords.slice(0, 5)),
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
  } = args;
  const exercises: Exercise[] = [];
  const used = [...fresh, ...recycled];
  const pool = used.length ? used : vocab.slice(0, 6);
  const vocabDe = vocab.map(displayWord);
  const vocabEn = vocab.map((item) => item.en);
  const phraseEn = phrases.map((item) => item.en);
  const allDe = uniqueWords([...vocabDe, ...phrases.map((item) => item.de), ...sentences.map((item) => item.de)]);
  const allEn = uniqueWords([...vocabEn, ...phraseEn, ...sentences.map((item) => item.en)]);
  const metaBase = {
    conceptId: concept?.id,
  };
  const isA1 = levelId === "a1";
  const models = (concept?.examples?.length ? concept.examples : sentences).slice(0, 6);
  const forms = concept?.forms ?? [];

  function addRecognition(items: VocabItem[], count: number) {
    items.slice(0, count).forEach((item, i) => {
      exercises.push(
        tag(
          mc(
            makeId("rec", exercises.length + i),
            `What does “${item.de}” mean?`,
            item.en,
            vocabEn,
            `${seed}-r-${i}`,
            { speak: item.de, explain: `${item.de} = ${item.en}` },
          ),
          {
            ...metaBase,
            phase: "learn",
            target: item.de,
            errorCategory: categoryForItem(item, concept),
          },
        ),
      );
    });
  }

  function addRecall(items: VocabItem[], count: number) {
    items.slice(0, count).forEach((item, i) => {
      exercises.push(
        tag(
          {
            type: "type-answer",
            id: makeId("recall", exercises.length + i),
            prompt: `How do you say “${item.en}”?`,
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
        ),
      );
    });
  }

  function addFormRecall(count: number) {
    forms.slice(0, count).forEach((row, i) => {
      exercises.push(
        tag(
          {
            type: "type-answer",
            id: makeId("form", i),
            prompt: `How do you say “${row.en}”?`,
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
        ),
      );
    });
  }

  function addCompletion(items: { de: string; en: string }[], count: number) {
    items.slice(0, count).forEach((item, i) => {
      const gap = blankToken(item.de);
      if (!gap) return;
      exercises.push(
        tag(
          {
            type: "fill-blank",
            id: makeId("gap", exercises.length + i),
            prompt: "Complete the sentence.",
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
        ),
      );
    });
  }

  function addArticles(count: number) {
    nouns.slice(0, count).forEach((item, i) => {
      const article = getArticle(item.de);
      if (!article) return;
      exercises.push(
        tag(
          {
            type: "fill-blank",
            id: makeId("art", i),
            prompt: "Fill in the correct article.",
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
        ),
      );
    });
  }

  function addConstruction(items: { de: string; en: string }[], count: number) {
    items.slice(0, count).forEach((item, i) => {
      const words = splitGerman(item.de);
      exercises.push(
        tag(
          {
            type: "drag-order",
            id: makeId("order", exercises.length + i),
            prompt: "Arrange the words into a correct German sentence.",
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
        ),
      );
    });
  }

  function addTranslation(items: { de: string; en: string }[], count: number) {
    items.slice(0, count).forEach((item, i) => {
      exercises.push(
        tag(
          {
            type: "type-answer",
            id: makeId("tr", exercises.length + i),
            prompt: `Write in German: “${item.en}”`,
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
        ),
      );
    });
  }

  function addProduction() {
    const writing = writings[1] ?? writings[0];
    exercises.push(
      tag(
        {
          type: "free-production",
          id: "produce",
          prompt: concept?.applicationPrompt ?? writing?.prompt ?? "Write 2–3 German sentences about this topic.",
          promptDe: concept?.applicationPromptDe ?? writing?.promptDe,
          sample: concept?.applicationSample ?? writing?.sample ?? models[0]?.de ?? "",
          keywords: concept?.applicationKeywords ?? writing?.hints.slice(0, 3),
          minSentences: 2,
          hints: writing?.hints,
        },
        {
          ...metaBase,
          modality: "production",
          phase: "application",
          target: concept?.title ?? "production",
          errorCategory: "other",
        },
      ),
    );
  }

  function addMatching(items: VocabItem[], count: number) {
    const pairs = items.slice(0, count).map((item) => ({ left: item.de, right: item.en }));
    if (pairs.length < 3) return;
    exercises.push(
      tag(
        {
          type: "matching",
          id: makeId("match", exercises.length),
          prompt: "Match German to meaning. This is recognition — recall comes next.",
          pairs,
        },
        { ...metaBase, modality: "recognition", phase: "learn", errorCategory: "vocabulary" },
      ),
    );
  }

  let passage: Lesson["passage"];
  let grammarNote: string | undefined = source.grammar[0];

  if (spec.focus === "learn" || spec.role === "introduction") {
    if (forms.length) addCompletion(models, 3);
    else {
      addCompletion(models, 2);
      addRecognition(pool, isA1 ? 1 : 2);
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
    addCompletion(models, 3);
    addArticles(isA1 ? 2 : 3);
    addConstruction(models, 2);
  } else if (spec.focus === "recall" && spec.skill !== "listening" && spec.skill !== "reading") {
    if (forms.length) addFormRecall(3);
    addRecall(pool, 3);
    addTranslation(models, 1);
  } else if (spec.role === "application") {
    addTranslation(models, 3);
    addConstruction(models.slice(0, 2), 1);
    addProduction();
  } else if (spec.focus === "review" && spec.skill !== "listening" && spec.skill !== "reading" && number !== 20) {
    addMatching(pool, 4);
    addRecall(pool, 2);
    addCompletion(models, 1);
    addConstruction(seededShuffle(sentences, `${seed}-rs`).slice(0, 1), 1);
    addTranslation(models, 1);
  }

  if (spec.skill === "listening") {
    const listenItems = (number === 18 ? phrases : pool).slice(0, 3);
    listenItems.forEach((item, i) => {
      const de = "de" in item ? item.de : "";
      const en = "en" in item ? item.en : "";
      if (!de) return;
      exercises.push(
        tag(
          {
            type: "listen-choice",
            id: makeId("listen", i),
            prompt: "Choose the meaning.",
            speak: de,
            options: seededShuffle(
              uniqueWords([en, ...pickDistractors(number === 18 ? phraseEn : vocabEn, en, 3, `${seed}-l-${i}`)]),
              `${seed}-lo-${i}`,
            ),
            answer: en,
            explain: `${de} = ${en}`,
          },
          { ...metaBase, modality: "recognition", phase: "understand", target: de, errorCategory: "vocabulary" },
        ),
      );
      exercises.push(
        tag(
          {
            type: "type-answer",
            id: makeId("listen-recall", i),
            prompt: `Now recall: how do you say “${en}”?`,
            answer: uniqueWords([de, stripArticle(de)]),
            speak: de,
          },
          { ...metaBase, modality: "recall", phase: "recall", target: de, errorCategory: "vocabulary" },
        ),
      );
    });
  }

  if (number === 13 || number === 14 || number === 15) {
    const selected = readings[(Math.max(0, number - 13) || 0) % readings.length] ?? readings[0];
    if (selected) {
      passage = {
        title: selected.title,
        titleDe: selected.titleDe,
        text: selected.text,
        translation: selected.translation,
      };
      selected.questions.slice(0, number === 15 ? 3 : 2).forEach((q, i) => {
        exercises.push(
          tag(
            {
              type: "multiple-choice",
              id: makeId("rq", i),
              prompt: q.question,
              options: q.options,
              answer: q.answer,
              explain: q.explain,
            },
            { ...metaBase, modality: "recognition", phase: "understand", errorCategory: "vocabulary" },
          ),
        );
      });
      const snippet = selected.text.split(/[.!?]/)[0]?.trim();
      if (snippet && spec.focus !== "understand") {
        exercises.push(
          tag(
            {
              type: "type-answer",
              id: "copy-sense",
              prompt: `Write this idea in German (from the text): “${selected.translation.split(/[.!?]/)[0]?.trim()}”`,
              answer: uniqueWords([snippet, `${snippet}.`]),
              speak: snippet,
            },
            { ...metaBase, modality: "recall", phase: "recall", target: snippet, errorCategory: "vocabulary" },
          ),
        );
      }
      if (snippet && number !== 13) {
        const words = splitGerman(`${snippet}.`);
        exercises.push(
          tag(
            {
              type: "drag-order",
              id: "rebuild-line",
              prompt: "Rebuild the first line of the text.",
              words: seededShuffle(words, `${seed}-line`),
              answer: words,
              speak: snippet,
            },
            { ...metaBase, modality: "construction", phase: "controlled-practice", target: snippet, errorCategory: "word-order" },
          ),
        );
      }
    }
  }

  if (number === 20) {
    addRecall(seededShuffle(vocab, `${seed}-q`).slice(0, 3), 3);
    addConstruction(seededShuffle(sentences, `${seed}-qs`).slice(0, 1), 1);
    const quizReading = readings[readings.length - 1] ?? readings[0];
    if (quizReading) {
      passage = {
        title: quizReading.title,
        titleDe: quizReading.titleDe,
        text: quizReading.text,
        translation: quizReading.translation,
      };
      quizReading.questions.slice(0, 1).forEach((q, i) => {
        exercises.push(
          tag(
            {
              type: "multiple-choice",
              id: makeId("quiz-r", i),
              prompt: q.question,
              options: q.options,
              answer: q.answer,
              explain: q.explain,
            },
            { ...metaBase, modality: "recognition", phase: "review" },
          ),
        );
      });
    }
    addTranslation(seededShuffle(sentences, `${seed}-qt`).slice(0, 2), 2);
    addProduction();
  }

  if (spec.skill === "vocab" && spec.role === "practice" && spec.focus === "recall" && phrases.length) {
    phrases.slice(0, 3).forEach((item, i) => {
      exercises.push(
        tag(
          {
            type: "type-answer",
            id: makeId("ph-type", i),
            prompt: `Write this in German: “${item.en}”`,
            answer: [item.de, item.de.replace(/[!?]/g, "").trim()],
            hint: item.note ?? item.de.split(" ")[0],
            speak: item.de,
          },
          { ...metaBase, modality: "recall", phase: "recall", target: item.de, errorCategory: "vocabulary" },
        ),
      );
    });
  }

  const filled = exercises.filter((exercise) => {
    if (exercise.type === "matching") return exercise.pairs.length >= 3;
    if (exercise.type === "drag-order") return exercise.answer.length > 1;
    if (exercise.type === "fill-blank") return Boolean(exercise.answer);
    if (exercise.type === "free-production") return Boolean(exercise.sample || exercise.prompt);
    return true;
  });

  const maxMc = number === 13 || number === 14 || number === 15 || number === 20 ? 4 : isA1 ? 2 : 3;
  const limited = capRecognition(filled, maxMc);
  const maxItems = isA1 ? 8 : 10;
  return { exercises: limited.slice(0, maxItems), passage, grammarNote };
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

function roleSummary(spec: LessonSpec, source: ChapterSource, concept?: GrammarConcept): string {
  const topic = concept?.title ?? source.title;
  if (spec.role === "introduction") {
    return `${topic}: learn the forms, read examples, then a little controlled practice.`;
  }
  if (spec.focus === "controlled-practice") {
    return `${topic}: complete the missing pieces while the model is still fresh.`;
  }
  if (spec.focus === "recall") {
    return `${topic}: the table is hidden. Produce the German from meaning.`;
  }
  if (spec.role === "application") {
    return `${topic}: write a few sentences of your own.`;
  }
  return `${topic}: mix recognition and recall, including words from earlier lessons.`;
}

function buildLessons(
  source: ChapterSource,
  levelId: LevelId,
  concepts: GrammarConcept[],
): Lesson[] {
  const vocab = source.vocab;
  const budget = VOCAB_BUDGET[levelId];
  const introAt = assignVocabLessons(vocab, budget);
  const nouns = nounPool(vocab);
  const recycleCount = levelId === "a1" ? 4 : 5;

  return LESSON_PLAN.map((spec, index) => {
    const number = index + 1;
    const id = String(number).padStart(2, "0");
    const seed = `${levelId}-${source.slug}-${id}`;
    const concept = primaryConcept(concepts, number);
    const { fresh, recycled } = vocabForLesson(vocab, introAt, number, recycleCount);
    const hideForms = spec.focus === "recall" || spec.role === "application";
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
    });
    const filled = built.exercises.length
      ? built.exercises
      : poolFallback(fresh.length ? fresh : vocab, seed, concept);
    return {
      id,
      number,
      title: spec.title,
      titleDe: spec.titleDe,
      skill: spec.skill,
      role: spec.role,
      summary: roleSummary(spec, source, concept),
      estimatedMinutes: 8 + (filled.length > 6 ? 3 : 0) + (teaching.length > 1 ? 3 : 2),
      conceptIds: conceptIdsFor(concepts, number, spec.role),
      newVocab: fresh,
      recycledVocab: recycled,
      passage: built.passage,
      grammarNote: built.grammarNote,
      teaching,
      exercises: filled,
    };
  });
}

function poolFallback(vocab: VocabItem[], _seed: string, concept?: GrammarConcept): Exercise[] {
  return vocab.slice(0, 4).map((item, i) =>
    tag(
      {
        type: "type-answer",
        id: makeId("fallback", i),
        prompt: `How do you say “${item.en}”?`,
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
