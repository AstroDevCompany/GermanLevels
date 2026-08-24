import type {
  Chapter,
  ChapterSource,
  Exercise,
  Lesson,
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

const LESSON_TITLES: { title: string; titleDe: string; skill: Skill }[] = [
  { title: "Get oriented", titleDe: "Orientierung", skill: "reading" },
  { title: "Words in context", titleDe: "Wörter im Kontext", skill: "vocab" },
  { title: "Say it in German", titleDe: "Auf Deutsch sagen", skill: "writing" },
  { title: "Match and remember", titleDe: "Zuordnen", skill: "vocab" },
  { title: "Missing pieces", titleDe: "Lücken füllen", skill: "grammar" },
  { title: "Choose precisely", titleDe: "Genau wählen", skill: "vocab" },
  { title: "Build the sentence", titleDe: "Satzbau", skill: "writing" },
  { title: "Listen and decide", titleDe: "Hören und entscheiden", skill: "listening" },
  { title: "Useful phrases", titleDe: "Wichtige Wendungen", skill: "vocab" },
  { title: "Phrase workshop", titleDe: "Phrasenwerkstatt", skill: "writing" },
  { title: "Grammar in focus", titleDe: "Grammatik im Fokus", skill: "grammar" },
  { title: "Form and function", titleDe: "Form und Funktion", skill: "grammar" },
  { title: "Read closely", titleDe: "Genau lesen", skill: "reading" },
  { title: "Read and respond", titleDe: "Lesen und reagieren", skill: "reading" },
  { title: "A longer look", titleDe: "Längerer Text", skill: "reading" },
  { title: "Write it out", titleDe: "Schreiben", skill: "writing" },
  { title: "Guided production", titleDe: "Geleitetes Schreiben", skill: "writing" },
  { title: "Sound and sense", titleDe: "Klang und Sinn", skill: "listening" },
  { title: "Mixed review", titleDe: "Gemischte Wiederholung", skill: "mixed" },
  { title: "Chapter check", titleDe: "Kapiteltest", skill: "mixed" },
];

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups.length ? groups : [[]];
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
  return items.map((item) => ({
    de: item.de,
    en: item.en,
    note: item.note,
  }));
}

function sentenceRows(items: { de: string; en: string }[]): TeachRow[] {
  return items.map((item) => ({ de: item.de, en: item.en }));
}

function readingCard(id: string, reading: Reading, body: string): TeachCard {
  return {
    id,
    kind: "reading",
    eyebrow: "Read first",
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
): TeachCard {
  return { id, kind: "list", eyebrow, title, body, rows };
}

function grammarCard(
  id: string,
  title: string,
  points: string[],
  body?: string,
): TeachCard {
  return {
    id,
    kind: "grammar",
    eyebrow: "Grammar",
    title,
    body,
    points: points.filter(Boolean),
  };
}

function makeTeaching(args: {
  number: number;
  source: ChapterSource;
  vChunk: VocabItem[];
  pChunk: Phrase[];
  sChunk: { de: string; en: string }[];
  reading: Reading;
  readings: Reading[];
  writings: WritingPrompt[];
  vocab: VocabItem[];
  phrases: Phrase[];
  sentences: { de: string; en: string }[];
  nouns: VocabItem[];
  seed: string;
}): TeachCard[] {
  const {
    number,
    source,
    vChunk,
    pChunk,
    sChunk,
    reading,
    readings,
    writings,
    vocab,
    phrases,
    sentences,
    nouns,
    seed,
  } = args;
  const cards: TeachCard[] = [];
  const words = vChunk.length ? vChunk : vocab.slice(0, 8);
  const usedPhrases = pChunk.length ? pChunk : phrases.slice(0, 6);
  const usedSentences = sChunk.length ? sChunk : sentences.slice(0, 6);

  if (number === 1) {
    cards.push(
      readingCard(
        "teach-read",
        reading,
        "Read this short text before any questions. Listen once, then reveal the English only if you need it.",
      ),
    );
    cards.push(
      listCard(
        "teach-vocab",
        "New words",
        "Learn these words from the text",
        vocabRows(words.slice(0, 6)),
        "Say each German word aloud. The quiz next will ask for these meanings.",
      ),
    );
    cards.push(
      grammarCard(
        "teach-grammar",
        "A rule to keep in mind",
        source.grammar.slice(0, 3),
        source.blurb,
      ),
    );
  }

  if (number === 2 || number === 6) {
    cards.push(
      listCard(
        "teach-words",
        "Vocabulary",
        number === 2 ? "Words in this lesson" : "Study the meanings, then choose precisely",
        vocabRows(words),
        "Cover the English column with your hand, then check. Practice starts after this page.",
      ),
    );
  }

  if (number === 3) {
    cards.push(
      listCard(
        "teach-type",
        "Writing prep",
        "You will type these in German",
        vocabRows(words),
        "Notice der / die / das. Typing without the article is accepted, but learning it now is better.",
      ),
    );
  }

  if (number === 4) {
    cards.push(
      listCard(
        "teach-match",
        "Vocabulary",
        "Study the pairs, then match them from memory",
        vocabRows(seededShuffle(vocab, seed).slice(0, 8)),
        "Read German → English twice. The next screen hides the pairing.",
      ),
    );
  }

  if (number === 5) {
    cards.push(
      grammarCard("teach-articles", "Articles: der, die, das", [
        "der = masculine, die = feminine, das = neuter. Learn the article with the noun.",
        "In the nominative plural, the article is always die.",
        source.grammar[0],
      ]),
    );
    if (nouns.length) {
      cards.push(
        listCard(
          "teach-nouns",
          "Nouns",
          "These nouns keep their article",
          vocabRows(nouns.slice(0, 6)),
          "Colour-coding in Settings can help der / die / das stand out.",
        ),
      );
    }
    cards.push(
      listCard(
        "teach-gaps",
        "Model sentences",
        "Read the full sentence before a word goes missing",
        sentenceRows(usedSentences.slice(0, 4)),
      ),
    );
  }

  if (number === 7) {
    cards.push(
      grammarCard("teach-order", "German word order", [
        "In a main clause the conjugated verb stays in position two.",
        "Capitalise the first word. Punctuation is its own tile.",
        source.grammar[0],
      ]),
    );
    cards.push(
      listCard(
        "teach-sentences",
        "Models",
        "Read the finished sentences first",
        sentenceRows(usedSentences.slice(0, 6)),
        "You will rebuild these from scrambled tiles. Learn the shape now.",
      ),
    );
  }

  if (number === 8) {
    cards.push(
      listCard(
        "teach-listen",
        "Listening prep",
        "Study each word and its meaning",
        vocabRows(words.slice(0, 6)),
        "Read each line carefully. Next, you will pick the English without looking back.",
      ),
    );
  }

  if (number === 9) {
    cards.push(
      listCard(
        "teach-phrases",
        "Phrases",
        "Useful lines for this chapter",
        phraseRows(usedPhrases.slice(0, 6)),
        "Read when you would say each one. Matching comes after.",
      ),
    );
  }

  if (number === 10) {
    cards.push(
      listCard(
        "teach-workshop",
        "Phrases",
        "Learn the phrase, then rebuild or type it",
        phraseRows(usedPhrases),
        "Pay attention to punctuation and capital letters — they count in the exercise.",
      ),
    );
  }

  if (number === 11) {
    cards.push(
      grammarCard(
        "teach-rules",
        "Grammar in this chapter",
        source.grammar,
        "Read each point. True/false items next will twist some of them on purpose.",
      ),
    );
    cards.push(
      listCard(
        "teach-correct",
        "Correct models",
        "These sentences already follow the rule",
        sentenceRows(usedSentences.slice(0, 4)),
      ),
    );
  }

  if (number === 12) {
    cards.push(
      grammarCard("teach-form", "Form and function", [
        source.grammar[1] ?? source.grammar[0],
        "If a word has der / die / das, that article is part of the word you must choose.",
        source.grammar[2] ?? "Gender does not change because of English.",
      ]),
    );
    if (nouns.length) {
      cards.push(
        listCard(
          "teach-gender",
          "Gender",
          "Correct article + noun",
          vocabRows(nouns.slice(0, 5)),
        ),
      );
    }
    cards.push(
      listCard(
        "teach-forms",
        "Sentences",
        "See the complete form before a gap appears",
        sentenceRows(usedSentences.slice(0, 4)),
      ),
    );
  }

  if (number === 13 || number === 14 || number === 15) {
    const selected = readings[(number - 13) % readings.length];
    cards.push(
      readingCard(
        "teach-passage",
        selected,
        number === 15
          ? "A longer look: read twice, listen once, then try the questions."
          : "Read closely first. Translation is here for study; during the quiz you can still open the text.",
      ),
    );
    cards.push(
      listCard(
        "teach-from-text",
        "From the text",
        "Words and lines worth keeping",
        vocabRows(words.slice(0, 6)),
      ),
    );
  }

  if (number === 16) {
    const writing = writings[0];
    cards.push(
      grammarCard(
        "teach-write-hints",
        writing?.prompt ?? "Before you write",
        writing?.hints ?? source.grammar.slice(0, 3),
        writing
          ? `${writing.promptDe} Study the model sentences, then type them from English.`
          : "Study the models, then write.",
      ),
    );
    cards.push(
      listCard(
        "teach-write-models",
        "Models",
        "These are the sentences you will write",
        sentenceRows(usedSentences.slice(0, 5)),
      ),
    );
  }

  if (number === 17) {
    const writing = writings[1] ?? writings[0];
    if (writing) {
      cards.push({
        id: "teach-guided",
        kind: "model",
        eyebrow: "Guided writing",
        title: writing.prompt,
        titleDe: writing.promptDe,
        body: "Read the checklist, then study a full model answer before you rebuild it.",
        points: writing.hints,
        speak: writing.sample,
      });
    }
    cards.push(
      listCard(
        "teach-guided-s",
        "Support sentences",
        "Extra models for the same topic",
        sentenceRows(usedSentences.slice(0, 3)),
      ),
    );
  }

  if (number === 18) {
    cards.push(
      listCard(
        "teach-sound-ph",
        "Sound and sense",
        "Phrases you will hear",
        phraseRows(phrases.slice(0, 4)),
        "Read each line now while you can see it. The quiz hides the German.",
      ),
    );
    cards.push(
      listCard(
        "teach-sound-s",
        "Sentences",
        "Hear the full sentence",
        sentenceRows(sentences.slice(0, 3)),
      ),
    );
  }

  if (number === 19) {
    cards.push(
      listCard(
        "teach-review-v",
        "Review",
        "Chapter words once more",
        vocabRows(seededShuffle(vocab, `${seed}-rv`).slice(0, 6)),
        "A mixed quiz follows: matching, order, typing, and a reading question.",
      ),
    );
    cards.push(
      listCard(
        "teach-review-s",
        "Sentences",
        "Rebuild these after you read them",
        sentenceRows(seededShuffle(sentences, `${seed}-rs`).slice(0, 2)),
      ),
    );
    cards.push(grammarCard("teach-review-g", "Rules to reuse", source.grammar.slice(0, 3)));
  }

  if (number === 20) {
    const quizReading = readings[readings.length - 1] ?? readings[0];
    cards.push(
      grammarCard(
        "teach-check-intro",
        "Chapter check — study, then test",
        source.grammar,
        "This is the last lesson in the chapter. Review the material below, then the quiz begins.",
      ),
    );
    cards.push(
      listCard(
        "teach-check-v",
        "Vocabulary",
        "Core words",
        vocabRows(seededShuffle(vocab, `${seed}-q`).slice(0, 4)),
      ),
    );
    cards.push(
      listCard(
        "teach-check-p",
        "Phrases",
        "Lines to rebuild",
        phraseRows(seededShuffle(phrases, `${seed}-qp`).slice(0, 2)),
      ),
    );
    cards.push(
      readingCard(
        "teach-check-r",
        quizReading,
        "Read this text now. Questions about it come after you finish studying.",
      ),
    );
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
          "Vocabulary",
          "Learn these words first",
          vocabRows(vocab.slice(0, 8)),
        ),
      ];
}

function buildLessons(source: ChapterSource, levelId: LevelId): Lesson[] {
  const vocab = source.vocab;
  const phrases = source.phrases;
  const sentences = source.sentences;
  const readings = source.readings;
  const writings = source.writings;
  const vocabDe = vocab.map(displayWord);
  const vocabEn = vocab.map((item) => item.en);
  const phraseDe = phrases.map((item) => item.de);
  const phraseEn = phrases.map((item) => item.en);
  const sentenceDe = sentences.map((item) => item.de);
  const allEn = uniqueWords([...vocabEn, ...phraseEn, ...sentences.map((s) => s.en)]);
  const allDe = uniqueWords([...vocabDe, ...phraseDe, ...sentenceDe]);
  const nouns = nounPool(vocab);
  const vocabChunks = chunk(vocab, Math.max(6, Math.ceil(vocab.length / 4)));
  const phraseChunks = chunk(phrases, Math.max(4, Math.ceil(phrases.length / 2)));
  const sentenceChunks = chunk(sentences, Math.max(4, Math.ceil(sentences.length / 4)));

  const lessons: Lesson[] = LESSON_TITLES.map((meta, index) => {
    const number = index + 1;
    const id = String(number).padStart(2, "0");
    const seed = `${levelId}-${source.slug}-${id}`;
    const exercises: Exercise[] = [];
    let passage: Lesson["passage"];
    let grammarNote: string | undefined;
    const vChunk = vocabChunks[index % vocabChunks.length] ?? vocab;
    const pChunk = phraseChunks[index % phraseChunks.length] ?? phrases;
    const sChunk = sentenceChunks[index % sentenceChunks.length] ?? sentences;
    const reading = readings[index % readings.length];

    if (number === 1) {
      passage = {
        title: reading.title,
        titleDe: reading.titleDe,
        text: reading.text,
        translation: reading.translation,
      };
      grammarNote = source.grammar[0];
      vChunk.slice(0, 6).forEach((item, i) => {
        exercises.push(
          mc(
            makeId("mc", i),
            `What does “${item.de}” mean?`,
            item.en,
            vocabEn,
            `${seed}-${i}`,
            { speak: item.de, explain: `${item.de} = ${item.en}` },
          ),
        );
      });
      if (reading.questions[0]) {
        const q = reading.questions[0];
        exercises.push({
          type: "multiple-choice",
          id: "read-q1",
          prompt: q.question,
          options: q.options,
          answer: q.answer,
          explain: q.explain,
        });
      }
    }

    if (number === 2) {
      exercises.push({
        type: "matching",
        id: "match-vocab",
        prompt: "Match each German word with its English meaning.",
        pairs: vChunk.slice(0, 6).map((item) => ({
          left: item.de,
          right: item.en,
        })),
      });
      vChunk.slice(0, 4).forEach((item, i) => {
        exercises.push(
          mc(
            makeId("sense", i),
            `Choose the German for “${item.en}”.`,
            item.de,
            vocabDe,
            `${seed}-g-${i}`,
            { explain: `${item.en} → ${item.de}` },
          ),
        );
      });
    }

    if (number === 3) {
      vChunk.forEach((item, i) => {
        exercises.push({
          type: "type-answer",
          id: makeId("type", i),
          prompt: `Type the German for “${item.en}”.`,
          answer: uniqueWords([
            item.de,
            stripArticle(item.de),
            item.de.replace(/^der |^die |^das /i, ""),
          ]),
          hint: item.hint ?? (getArticle(item.de) ? `Article: ${getArticle(item.de)}` : item.de.slice(0, 1).toUpperCase() + "…"),
          speak: item.de,
        });
      });
    }

    if (number === 4) {
      exercises.push({
        type: "matching",
        id: "match-more",
        prompt: "Match each German word with its English meaning.",
        pairs: seededShuffle(vocab, seed)
          .slice(0, 8)
          .map((item) => ({ left: item.de, right: item.en })),
      });
    }

    if (number === 5) {
      if (nouns.length >= 4) {
        nouns.slice(0, 6).forEach((item, i) => {
          const article = getArticle(item.de);
          if (!article) return;
          exercises.push({
            type: "fill-blank",
            id: makeId("art", i),
            prompt: "Fill in the correct article.",
            sentence: `___ ${stripArticle(item.de)}`,
            answer: article,
            options: seededShuffle(["der", "die", "das"], `${seed}-a-${i}`),
            hint: item.en,
            speak: item.de,
          });
        });
      }
      sChunk.slice(0, 4).forEach((item, i) => {
        const tokens = splitGerman(item.de).filter((token) => !/^[.,!?]$/.test(token));
        const blank = tokens[Math.min(1, tokens.length - 1)] ?? tokens[0];
        if (!blank) return;
        exercises.push({
          type: "fill-blank",
          id: makeId("gap", i),
          prompt: "Type the missing word.",
          sentence: item.de.replace(blank, "___"),
          answer: [blank, blank.replace(/^[A-ZÄÖÜ]/, (c) => c.toLowerCase())],
          hint: item.en,
          speak: item.de,
          options: uniqueWords([
            blank,
            ...pickDistractors(allDe, blank, 3, `${seed}-gap-${i}`),
          ]),
        });
      });
    }

    if (number === 6) {
      vChunk.forEach((item, i) => {
        exercises.push(
          mc(
            makeId("pick", i),
            i % 2 === 0
              ? `Which word means “${item.en}”?`
              : `What is the best meaning of “${item.de}”?`,
            i % 2 === 0 ? item.de : item.en,
            i % 2 === 0 ? vocabDe : vocabEn,
            `${seed}-${i}`,
            { speak: item.de },
          ),
        );
      });
    }

    if (number === 7) {
      sChunk.slice(0, 6).forEach((item, i) => {
        const words = splitGerman(item.de);
        exercises.push({
          type: "drag-order",
          id: makeId("order", i),
          prompt: "Arrange the words into a correct German sentence.",
          words: seededShuffle(words, `${seed}-w-${i}`),
          answer: words,
          translation: item.en,
          speak: item.de,
        });
      });
    }

    if (number === 8) {
      vChunk.slice(0, 6).forEach((item, i) => {
        exercises.push({
          type: "listen-choice",
          id: makeId("listen", i),
          prompt: "Choose the meaning.",
          speak: item.de,
          options: seededShuffle(
            uniqueWords([
              item.en,
              ...pickDistractors(vocabEn, item.en, 3, `${seed}-l-${i}`),
            ]),
            `${seed}-lo-${i}`,
          ),
          answer: item.en,
          explain: `${item.de} = ${item.en}`,
        });
      });
    }

    if (number === 9) {
      exercises.push({
        type: "matching",
        id: "match-phrases",
        prompt: "Match each phrase with its meaning.",
        pairs: pChunk.slice(0, 6).map((item) => ({
          left: item.de,
          right: item.en,
        })),
      });
      pChunk.slice(0, 3).forEach((item, i) => {
        exercises.push(
          mc(
            makeId("ph", i),
            `When would you say “${item.de}”?`,
            item.en,
            phraseEn,
            `${seed}-p-${i}`,
            { speak: item.de, explain: item.note },
          ),
        );
      });
    }

    if (number === 10) {
      pChunk.forEach((item, i) => {
        const words = splitGerman(item.de);
        if (i % 2 === 0) {
          exercises.push({
            type: "drag-order",
            id: makeId("ph-order", i),
            prompt: "Rebuild the phrase.",
            words: seededShuffle(words, `${seed}-pw-${i}`),
            answer: words,
            translation: item.en,
            speak: item.de,
          });
        } else {
          exercises.push({
            type: "type-answer",
            id: makeId("ph-type", i),
            prompt: `Write this in German: “${item.en}”`,
            answer: [item.de, item.de.replace(/[!?]/g, "").trim()],
            hint: item.note ?? item.de.split(" ")[0],
            speak: item.de,
          });
        }
      });
    }

    if (number === 11) {
      grammarNote = source.grammar[0];
      source.grammar.slice(0, 4).forEach((point, i) => {
        exercises.push({
          type: "true-false",
          id: makeId("tf", i),
          prompt: "Decide if the grammar note is used correctly.",
          statement: i % 2 === 0 ? point : `${point} This rule never matters in real German.`,
          answer: i % 2 === 0,
          explain: point,
        });
      });
      sChunk.slice(0, 4).forEach((item, i) => {
        const wrong = sentences[(i + 1) % sentences.length]?.de ?? item.de;
        exercises.push(
          mc(
            makeId("gr", i),
            "Which sentence is correct?",
            item.de,
            uniqueWords([item.de, wrong, `${wrong} nicht`, allDe[i] ?? "Ja."]),
            `${seed}-gr-${i}`,
            { speak: item.de, explain: item.en },
          ),
        );
      });
    }

    if (number === 12) {
      grammarNote = source.grammar[1] ?? source.grammar[0];
      if (nouns.length) {
        nouns.slice(0, 5).forEach((item, i) => {
          const article = getArticle(item.de);
          exercises.push(
            mc(
              makeId("gender", i),
              `Choose the correct form for “${item.en}”.`,
              item.de,
              uniqueWords([
                item.de,
                `der ${stripArticle(item.de)}`,
                `die ${stripArticle(item.de)}`,
                `das ${stripArticle(item.de)}`,
              ]),
              `${seed}-gen-${i}`,
              {
                explain: article
                  ? `${item.de} is ${article === "der" ? "masculine" : article === "die" ? "feminine" : "neuter"}.`
                  : item.de,
              },
            ),
          );
        });
      }
      sChunk.slice(0, 4).forEach((item, i) => {
        const tokens = splitGerman(item.de).filter((token) => token.length > 3);
        const target = tokens[0];
        if (!target) return;
        exercises.push({
          type: "fill-blank",
          id: makeId("form", i),
          prompt: "Complete the sentence with the right form.",
          sentence: item.de.replace(target, "___"),
          answer: target,
          options: uniqueWords([
            target,
            ...pickDistractors(allDe, target, 3, `${seed}-form-${i}`),
          ]),
          hint: item.en,
          speak: item.de,
        });
      });
    }

    if (number === 13 || number === 14 || number === 15) {
      const selected = readings[(number - 13) % readings.length];
      passage = {
        title: selected.title,
        titleDe: selected.titleDe,
        text: selected.text,
        translation: selected.translation,
      };
      selected.questions.forEach((q, i) => {
        exercises.push({
          type: "multiple-choice",
          id: makeId("rq", i),
          prompt: q.question,
          options: q.options,
          answer: q.answer,
          explain: q.explain,
        });
      });
      const snippet = selected.text.split(/[.!?]/)[0]?.trim();
      if (snippet) {
        exercises.push({
          type: "type-answer",
          id: "copy-sense",
          prompt: `Translate this line into English: “${snippet}.”`,
          answer: uniqueWords(
            selected.translation
              .split(/[.!?]/)
              .map((part) => part.trim())
              .filter(Boolean)
              .slice(0, 2),
          ),
          hint: "Use the passage translation if you need a model, then try from memory.",
          speak: snippet,
        });
        const words = splitGerman(`${snippet}.`);
        exercises.push({
          type: "drag-order",
          id: "rebuild-line",
          prompt: "Rebuild the first line of the text.",
          words: seededShuffle(words, `${seed}-line`),
          answer: words,
          speak: snippet,
        });
      }
      if (number === 14) {
        exercises.push({
          type: "true-false",
          id: "main-idea",
          prompt: "True or false about the text?",
          statement: `${selected.title} is mainly about: ${selected.translation.split(".")[0]}.`,
          answer: true,
          explain: selected.translation.split(".")[0],
        });
      }
    }

    if (number === 16) {
      const writing = writings[0];
      grammarNote = writing?.hints.join(" · ");
      sChunk.slice(0, 5).forEach((item, i) => {
        exercises.push({
          type: "type-answer",
          id: makeId("write", i),
          prompt: `Write in German: “${item.en}”`,
          answer: [item.de, item.de.replace(/[.!?]/g, "").trim()],
          hint: writing?.hints[i % (writing?.hints.length || 1)],
          speak: item.de,
        });
      });
    }

    if (number === 17) {
      const writing = writings[1] ?? writings[0];
      passage = writing
        ? {
            title: writing.prompt,
            titleDe: writing.promptDe,
            text: writing.hints.map((hint, i) => `${i + 1}. ${hint}`).join("\n"),
            translation: writing.sample,
          }
        : undefined;
      (writing ? [writing, writings[0]] : writings).filter(Boolean).slice(0, 2).forEach((item, i) => {
        if (!item) return;
        const words = splitGerman(item.sample);
        exercises.push({
          type: "drag-order",
          id: makeId("sample", i),
          prompt: `${item.prompt} Rebuild a model answer.`,
          words: seededShuffle(words, `${seed}-wr-${i}`),
          answer: words,
          translation: item.prompt,
          speak: item.sample,
        });
      });
      sChunk.slice(0, 3).forEach((item, i) => {
        exercises.push({
          type: "fill-blank",
          id: makeId("write-gap", i),
          prompt: "Complete this model sentence.",
          sentence: (() => {
            const tokens = splitGerman(item.de).filter((token) => token.length > 2);
            const hole = tokens[Math.min(2, tokens.length - 1)] ?? tokens[0];
            return item.de.replace(hole, "___");
          })(),
          answer: splitGerman(item.de).filter((token) => token.length > 2)[
            Math.min(2, splitGerman(item.de).filter((token) => token.length > 2).length - 1)
          ],
          hint: item.en,
          speak: item.de,
        });
      });
    }

    if (number === 18) {
      phrases.slice(0, 4).forEach((item, i) => {
        exercises.push({
          type: "listen-choice",
          id: makeId("hear-ph", i),
          prompt: "Choose the matching English.",
          speak: item.de,
          options: seededShuffle(
            uniqueWords([item.en, ...pickDistractors(phraseEn, item.en, 3, `${seed}-hp-${i}`)]),
            `${seed}-hpo-${i}`,
          ),
          answer: item.en,
        });
      });
      sentences.slice(0, 3).forEach((item, i) => {
        exercises.push({
          type: "listen-choice",
          id: makeId("hear-s", i),
          prompt: "Choose the meaning of the sentence.",
          speak: item.de,
          options: seededShuffle(
            uniqueWords([
              item.en,
              ...pickDistractors(allEn, item.en, 3, `${seed}-hs-${i}`),
            ]),
            `${seed}-hso-${i}`,
          ),
          answer: item.en,
        });
      });
    }

    if (number === 19) {
      exercises.push({
        type: "matching",
        id: "review-match",
        prompt: "Quick review: pair German and English.",
        pairs: seededShuffle(vocab, `${seed}-rv`)
          .slice(0, 6)
          .map((item) => ({ left: item.de, right: item.en })),
      });
      seededShuffle(sentences, `${seed}-rs`).slice(0, 2).forEach((item, i) => {
        exercises.push({
          type: "drag-order",
          id: makeId("rev-order", i),
          prompt: "Rebuild the sentence.",
          words: seededShuffle(splitGerman(item.de), `${seed}-ro-${i}`),
          answer: splitGerman(item.de),
          translation: item.en,
          speak: item.de,
        });
      });
      seededShuffle(vocab, `${seed}-rt`).slice(0, 3).forEach((item, i) => {
        exercises.push({
          type: "type-answer",
          id: makeId("rev-type", i),
          prompt: i % 2 === 0 ? `German for “${item.en}”?` : `English for “${item.de}”?`,
          answer: i % 2 === 0 ? [item.de, stripArticle(item.de)] : item.en,
          speak: item.de,
        });
      });
      if (readings[0]?.questions[0]) {
        const q = readings[0].questions[0];
        exercises.push({
          type: "multiple-choice",
          id: "rev-read",
          prompt: q.question,
          options: q.options,
          answer: q.answer,
          explain: q.explain,
        });
      }
    }

    if (number === 20) {
      seededShuffle(vocab, `${seed}-q`).slice(0, 4).forEach((item, i) => {
        exercises.push(
          mc(
            makeId("quiz-v", i),
            `“${item.de}” means…`,
            item.en,
            vocabEn,
            `${seed}-qv-${i}`,
            { speak: item.de },
          ),
        );
      });
      seededShuffle(phrases, `${seed}-qp`).slice(0, 2).forEach((item, i) => {
        const words = splitGerman(item.de);
        exercises.push({
          type: "drag-order",
          id: makeId("quiz-p", i),
          prompt: "Rebuild the phrase for the chapter quiz.",
          words: seededShuffle(words, `${seed}-qpw-${i}`),
          answer: words,
          translation: item.en,
          speak: item.de,
        });
      });
      const quizReading = readings[readings.length - 1] ?? readings[0];
      passage = {
        title: quizReading.title,
        titleDe: quizReading.titleDe,
        text: quizReading.text,
        translation: quizReading.translation,
      };
      quizReading.questions.slice(0, 2).forEach((q, i) => {
        exercises.push({
          type: "multiple-choice",
          id: makeId("quiz-r", i),
          prompt: q.question,
          options: q.options,
          answer: q.answer,
          explain: q.explain,
        });
      });
      seededShuffle(sentences, `${seed}-qs`).slice(0, 2).forEach((item, i) => {
        exercises.push({
          type: "type-answer",
          id: makeId("quiz-t", i),
          prompt: `Write in German: “${item.en}”`,
          answer: [item.de, item.de.replace(/[.!?]/g, "").trim()],
          speak: item.de,
        });
      });
    }

    const filled = exercises.filter((exercise) => {
      if (exercise.type === "matching") return exercise.pairs.length >= 3;
      if (exercise.type === "drag-order") return exercise.answer.length > 1;
      if (exercise.type === "fill-blank") return Boolean(exercise.answer);
      return true;
    });

    const teaching = makeTeaching({
      number,
      source,
      vChunk,
      pChunk,
      sChunk,
      reading,
      readings,
      writings,
      vocab,
      phrases,
      sentences,
      nouns,
      seed,
    });

    return {
      id,
      number,
      title: meta.title,
      titleDe: meta.titleDe,
      skill: source.skill === "mixed" ? meta.skill : number % 5 === 0 ? source.skill : meta.skill,
      summary: `${source.title}: study the new material first, then practise.`,
      estimatedMinutes:
        8 + (filled.length > 6 ? 3 : 0) + (teaching.length > 1 ? 3 : 2) + (passage ? 1 : 0),
      passage,
      grammarNote,
      teaching,
      exercises: filled.slice(0, 10),
    };
  });

  return lessons.map((lesson) =>
    lesson.exercises.length
      ? lesson
      : {
          ...lesson,
          teaching:
            lesson.teaching.length > 0
              ? lesson.teaching
              : [
                  listCard(
                    "teach-fallback",
                    "Vocabulary",
                    "Learn these words first",
                    vocabRows(vocab.slice(0, 5)),
                  ),
                ],
          exercises: vocab.slice(0, 5).map((item, i) =>
            mc(
              makeId("fallback", i),
              `What does “${item.de}” mean?`,
              item.en,
              vocabEn,
              `${levelId}-${source.slug}-fb-${i}`,
              { speak: item.de },
            ),
          ),
        },
  );
}

export function buildChapter(
  source: ChapterSource,
  index: number,
  levelId: LevelId,
): Chapter {
  return {
    slug: source.slug,
    number: index + 1,
    title: source.title,
    titleDe: source.titleDe,
    blurb: source.blurb,
    skill: source.skill,
    grammar: source.grammar,
    vocab: source.vocab,
    lessons: buildLessons(source, levelId),
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
