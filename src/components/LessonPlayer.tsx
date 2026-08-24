"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GermanChars, insertChar } from "@/components/GermanChars";
import { useApp } from "@/components/Providers";
import { getChapter } from "@/content/index";
import type { Exercise, Lesson, LevelId, TeachCard } from "@/content/types";
import { answersMatch, articleClass, seededShuffle } from "@/lib/german";
import { findTaughtLesson, type TaughtLesson } from "@/lib/review";

type ReviewFeedback = {
  review: TaughtLesson | null;
  currentLessonId: string;
  reviewHref: (id: string) => string;
  onReviewCurrent: () => void;
};

type Props = {
  levelId: LevelId;
  chapterSlug: string;
  chapterTitle: string;
  lesson: Lesson;
  nextHref?: string;
};

export function LessonPlayer({
  levelId,
  chapterSlug,
  chapterTitle,
  lesson,
  nextHref,
}: Props) {
  const { prefs, completeLesson, saveLessonProgress, starWord, progress } = useApp();
  const teaching = lesson.teaching ?? [];
  const chapterLessons = getChapter(levelId, chapterSlug)?.lessons ?? [];
  const [phase, setPhase] = useState<"teach" | "quiz">(teaching.length ? "teach" : "quiz");
  const [teachIndex, setTeachIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [scored, setScored] = useState<Set<string>>(new Set());
  const [awarded, setAwarded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const exercise = lesson.exercises[index];
  const total = lesson.exercises.length;
  const teachTotal = teaching.length;
  const steps = Math.max(1, teachTotal + total);
  const step =
    phase === "teach" ? teachIndex + 1 : teachTotal + index + 1;
  const keepPassage =
    phase === "quiz" &&
    Boolean(lesson.passage) &&
    (lesson.skill === "reading" || lesson.number === 1 || lesson.number === 20);
  const canGoBack =
    done ||
    (phase === "quiz" && (index > 0 || teachTotal > 0)) ||
    (phase === "teach" && teachIndex > 0);

  function persist(percent: number) {
    saveLessonProgress({
      level: levelId,
      chapter: chapterSlug,
      lesson: lesson.id,
      percent,
    });
  }

  useEffect(() => {
    saveLessonProgress({
      level: levelId,
      chapter: chapterSlug,
      lesson: lesson.id,
      percent: Math.round(((step - 1) / steps) * 100),
    });
  }, [levelId, chapterSlug, lesson.id]);

  function onResult(correct: boolean) {
    const id = exercise.id;
    if (!scored.has(id)) {
      setScored((current) => new Set(current).add(id));
      if (correct) setScore((value) => value + 1);
    }
    const nextScore = scored.has(id) ? score : score + (correct ? 1 : 0);
    if (index + 1 >= total) {
      setDone(true);
      if (!awarded) {
        setAwarded(true);
        completeLesson({
          level: levelId,
          chapter: chapterSlug,
          lesson: lesson.id,
          score: nextScore,
          total,
        });
      }
    } else {
      setIndex((value) => value + 1);
      persist(Math.round(((teachTotal + index + 1) / steps) * 100));
    }
  }

  function onTeachContinue() {
    const nextTeach = teachIndex + 1;
    if (nextTeach >= teachTotal) {
      setShowTranslation(false);
      setPhase("quiz");
      persist(Math.round((teachTotal / steps) * 100));
    } else {
      setShowTranslation(false);
      setTeachIndex(nextTeach);
      persist(Math.round((nextTeach / steps) * 100));
    }
  }

  function goBack() {
    if (done) {
      setDone(false);
      return;
    }
    if (phase === "quiz") {
      if (index > 0) {
        setIndex((value) => value - 1);
      } else if (teachTotal > 0) {
        setPhase("teach");
        setTeachIndex(teachTotal - 1);
      }
      return;
    }
    if (teachIndex > 0) setTeachIndex((value) => value - 1);
  }

  function reviewCurrent() {
    setDone(false);
    setShowTranslation(false);
    setIndex(0);
    if (teachTotal > 0) {
      setPhase("teach");
      setTeachIndex(0);
    }
  }

  if (!exercise && !done) {
    return <p>This lesson is still being filled in.</p>;
  }

  if (done) {
    return (
      <section className="lesson-step rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-10">
        <p className="text-sm text-[var(--muted)]">{chapterTitle}</p>
        <h1 className="mt-3 text-3xl font-semibold">Lesson complete</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          You scored {score} / {total} on the practice. XP is saved on this device.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button type="button" className="chip" onClick={goBack}>
            Previous
          </button>
          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
            >
              Next lesson
            </Link>
          ) : null}
          <Link href={`/courses/${levelId}/${chapterSlug}`} className="chip">
            Back to chapter
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm text-[var(--muted)]">{chapterTitle}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Lesson {lesson.number} of 20
        </p>
        <p className="mt-2 text-sm capitalize text-[var(--muted)]">{lesson.skill}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{lesson.summary}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {phase === "teach" ? "Learn" : "Practice"}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {step} of {steps}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-linear-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-500"
            style={{ width: `${(step / steps) * 100}%` }}
          />
        </div>
      </div>

      <div key={`${phase}-${phase === "teach" ? teachIndex : index}`} className="lesson-step">
        {phase === "teach" ? (
          <TeachPanel
            card={teaching[teachIndex]}
            showTranslation={showTranslation}
            onToggleTranslation={() => setShowTranslation((value) => !value)}
            starred={progress.starred}
            onStar={starWord}
            isLast={teachIndex + 1 >= teachTotal}
            canGoBack={canGoBack}
            onBack={goBack}
            onContinue={onTeachContinue}
          />
        ) : (
          <div className="grid gap-8">
            {keepPassage && lesson.passage ? (
              <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-8">
                <p className="text-sm text-[var(--muted)]">Text for the questions</p>
                <h2 className="mt-2 font-medium">{lesson.passage.titleDe}</h2>
                <p className="reading-serif mt-5 whitespace-pre-wrap text-lg leading-8">
                  {lesson.passage.text}
                </p>
              </article>
            ) : null}
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              showHints={prefs.showHints}
              starred={progress.starred}
              onStar={starWord}
              onResult={onResult}
              canGoBack={canGoBack}
              onBack={goBack}
              review={findTaughtLesson(exercise, chapterLessons, lesson.id)}
              currentLessonId={lesson.id}
              reviewHref={(id) => `/courses/${levelId}/${chapterSlug}/${id}`}
              onReviewCurrent={reviewCurrent}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TeachPanel({
  card,
  showTranslation,
  onToggleTranslation,
  starred,
  onStar,
  isLast,
  canGoBack,
  onBack,
  onContinue,
}: {
  card: TeachCard;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  starred: string[];
  onStar: (word: string) => void;
  isLast: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{card.eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{card.title}</h2>
      {card.titleDe ? <p className="mt-2 text-[var(--muted)]">{card.titleDe}</p> : null}
      {card.body ? <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">{card.body}</p> : null}

      {card.speak && (card.kind === "reading" || card.kind === "model") ? (
        <p className="reading-serif mt-6 whitespace-pre-wrap text-lg leading-8">{card.speak}</p>
      ) : null}

      {card.points?.length ? (
        <ul className="mt-6 grid gap-3">
          {card.points.map((point) => (
            <li key={point} className="rounded-2xl border border-[var(--line)] px-4 py-4 leading-7">
              {point}
            </li>
          ))}
        </ul>
      ) : null}

      {card.rows?.length ? (
        <ul className="mt-6 grid gap-4">
          {card.rows.map((row, rowIndex) => (
            <li
              key={`${row.de}-${rowIndex}`}
              className="rounded-2xl border border-[var(--line)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-medium ${articleClass(row.de)}`}>{row.de}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{row.en}</p>
                  {row.note ? <p className="mt-2 text-xs leading-6 text-[var(--muted)]">{row.note}</p> : null}
                </div>
                <button
                  type="button"
                  className="chip"
                  onClick={() => onStar(row.de)}
                  aria-label="Star word"
                >
                  {starred.includes(row.de) ? "★" : "☆"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {card.translation ? (
        <div className="mt-6">
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={onToggleTranslation}
          >
            {showTranslation ? "Hide English" : "Show English"}
          </button>
          {showTranslation ? (
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-[var(--muted)]">
              {card.translation}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {canGoBack ? (
          <button type="button" className="chip" onClick={onBack}>
            Previous
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
          onClick={onContinue}
        >
          {isLast ? "Start practice" : "Continue"}
        </button>
      </div>
    </section>
  );
}

function ExerciseCard({
  exercise,
  showHints,
  starred,
  onStar,
  onResult,
  canGoBack,
  onBack,
  review,
  currentLessonId,
  reviewHref,
  onReviewCurrent,
}: {
  exercise: Exercise;
  showHints: boolean;
  starred: string[];
  onStar: (word: string) => void;
  onResult: (correct: boolean) => void;
  canGoBack: boolean;
  onBack: () => void;
  review: TaughtLesson | null;
  currentLessonId: string;
  reviewHref: (id: string) => string;
  onReviewCurrent: () => void;
}) {
  const feedback = {
    review,
    currentLessonId,
    reviewHref,
    onReviewCurrent,
  };
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-8">
      <h2 className="text-lg font-medium leading-8">{exercise.prompt}</h2>
      {"promptDe" in exercise && exercise.promptDe ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{exercise.promptDe}</p>
      ) : null}
      {exercise.type === "multiple-choice" || exercise.type === "listen-choice" ? (
        <ChoiceExercise
          exercise={exercise}
          showPromptText={exercise.type === "listen-choice"}
          onResult={onResult}
          feedback={feedback}
        />
      ) : null}
      {exercise.type === "true-false" ? (
        <TrueFalseExercise exercise={exercise} onResult={onResult} feedback={feedback} />
      ) : null}
      {exercise.type === "fill-blank" ? (
        <FillBlankExercise
          exercise={exercise}
          showHints={showHints}
          onResult={onResult}
          feedback={feedback}
        />
      ) : null}
      {exercise.type === "type-answer" ? (
        <TypeExercise
          exercise={exercise}
          showHints={showHints}
          onResult={onResult}
          feedback={feedback}
        />
      ) : null}
      {exercise.type === "drag-order" ? (
        <DragOrderExercise exercise={exercise} onResult={onResult} feedback={feedback} />
      ) : null}
      {exercise.type === "matching" ? (
        <MatchingExercise
          exercise={exercise}
          starred={starred}
          onStar={onStar}
          onResult={onResult}
          feedback={feedback}
        />
      ) : null}
      <div className="mt-8">
        {canGoBack ? (
          <button type="button" className="chip" onClick={onBack}>
            Previous
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ChoiceExercise({
  exercise,
  showPromptText,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "multiple-choice" | "listen-choice" }>;
  showPromptText?: boolean;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const locked = picked !== null;
  return (
    <div className="mt-6 grid gap-3">
      {showPromptText && "speak" in exercise && exercise.speak ? (
        <p className="reading-serif mb-2 text-xl leading-8">{exercise.speak}</p>
      ) : null}
      {exercise.options.map((option) => {
        const selected = picked === option;
        const good = locked && option === exercise.answer;
        const bad = locked && selected && option !== exercise.answer;
        return (
          <button
            key={option}
            type="button"
            disabled={locked}
            onClick={() => setPicked(option)}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              good
                ? "feedback-ok border-[var(--ok)] bg-[color-mix(in_oklab,var(--ok)_22%,transparent)]"
                : bad
                  ? "feedback-bad border-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)]"
                  : selected
                    ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                    : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            <span className={articleClass(option)}>{option}</span>
          </button>
        );
      })}
      {locked ? (
        <ResultBar
          correct={picked === exercise.answer}
          explain={exercise.explain}
          onNext={() => onResult(picked === exercise.answer)}
          feedback={feedback}
        />
      ) : null}
    </div>
  );
}

function TrueFalseExercise({
  exercise,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "true-false" }>;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const [picked, setPicked] = useState<boolean | null>(null);
  return (
    <div className="mt-5">
      <p className="reading-serif text-lg leading-8">{exercise.statement}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            disabled={picked !== null}
            onClick={() => setPicked(value)}
            className={`chip ${
              picked === value
                ? picked === exercise.answer
                  ? "feedback-ok border-[var(--ok)]"
                  : "feedback-bad border-[var(--danger)]"
                : picked !== null && value === exercise.answer
                  ? "border-[var(--ok)]"
                  : ""
            }`}
          >
            {value ? "True" : "False"}
          </button>
        ))}
      </div>
      {picked !== null ? (
        <ResultBar
          correct={picked === exercise.answer}
          explain={exercise.explain}
          onNext={() => onResult(picked === exercise.answer)}
          feedback={feedback}
        />
      ) : null}
    </div>
  );
}

function FillBlankExercise({
  exercise,
  showHints,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "fill-blank" }>;
  showHints: boolean;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const [value, setValue] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const given = placed ?? value;
  const correct = answersMatch(given, exercise.answer);

  return (
    <div className="mt-5">
      <p className="reading-serif text-lg leading-9">
        {exercise.sentence.split("___").map((part, i, arr) => (
          <span key={part + i}>
            {part}
            {i < arr.length - 1 ? (
              <input
                ref={inputRef}
                value={given}
                onChange={(event) => {
                  setPlaced(null);
                  setValue(event.target.value);
                }}
                className="blank bg-transparent outline-none"
                aria-label="Missing word"
              />
            ) : null}
          </span>
        ))}
      </p>
      {exercise.options?.length ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {exercise.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${placed === option ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]" : ""}`}
              onClick={() => setPlaced(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      {showHints && exercise.hint ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{exercise.hint}</p>
      ) : null}
      <GermanChars
        disabled={checked}
        onInsert={(char) => {
          setPlaced(null);
          setValue((current) => insertChar(placed ?? current, char, inputRef.current));
        }}
      />
      {!checked ? (
        <button
          type="button"
          className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          onClick={() => setChecked(true)}
        >
          Check
        </button>
      ) : (
        <ResultBar
          correct={correct}
          explain={Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer}
          onNext={() => onResult(correct)}
          feedback={feedback}
        />
      )}
    </div>
  );
}

function TypeExercise({
  exercise,
  showHints,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "type-answer" }>;
  showHints: boolean;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const correct = answersMatch(value, exercise.answer);
  return (
    <div className="mt-5">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        placeholder="Type your answer"
        autoCapitalize="off"
      />
      <GermanChars
        disabled={checked}
        onInsert={(char) => setValue((current) => insertChar(current, char, inputRef.current))}
      />
      {showHints && exercise.hint ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{exercise.hint}</p>
      ) : null}
      {!checked ? (
        <button
          type="button"
          className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          onClick={() => setChecked(true)}
        >
          Check
        </button>
      ) : (
        <ResultBar
          correct={correct}
          explain={Array.isArray(exercise.answer) ? exercise.answer.join(" / ") : exercise.answer}
          onNext={() => onResult(correct)}
          feedback={feedback}
        />
      )}
    </div>
  );
}

function DragOrderExercise({
  exercise,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "drag-order" }>;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const [pool, setPool] = useState(exercise.words);
  const [slots, setSlots] = useState<(string | null)[]>(
    exercise.answer.map(() => null),
  );
  const [checked, setChecked] = useState(false);
  const built = slots.map((slot) => slot ?? "").filter(Boolean);
  const builtText = built.join(" ").replace(/ ([.,!?;:])/g, "$1");
  const correct =
    slots.every(Boolean) &&
    slots.join(" ") === exercise.answer.join(" ");

  function place(word: string, fromPool = true) {
    const empty = slots.findIndex((slot) => slot === null);
    if (empty === -1) return;
    setSlots((current) => current.map((slot, i) => (i === empty ? word : slot)));
    if (fromPool) {
      setPool((current) => {
        const next = [...current];
        const at = next.indexOf(word);
        if (at >= 0) next.splice(at, 1);
        return next;
      });
    }
  }

  function remove(index: number) {
    const word = slots[index];
    if (!word) return;
    setSlots((current) => current.map((slot, i) => (i === index ? null : slot)));
    setPool((current) => [...current, word]);
  }

  return (
    <div className="mt-5">
      {exercise.translation ? (
        <p className="text-sm text-[var(--muted)]">{exercise.translation}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {slots.map((slot, i) => (
          <button
            key={`${slot}-${i}`}
            type="button"
            className="drop-slot min-w-16 px-3 py-2"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const word = event.dataTransfer.getData("text/plain");
              if (!word) return;
              const previous = slots[i];
              if (previous === word) return;
              setSlots((current) => current.map((item, idx) => (idx === i ? word : item)));
              setPool((current) => {
                const next = [...current];
                const at = next.indexOf(word);
                if (at >= 0) next.splice(at, 1);
                if (previous) next.push(previous);
                return next;
              });
            }}
            onClick={() => slot && remove(i)}
          >
            {slot ?? " "}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {pool.map((word, poolIndex) => (
          <button
            key={`${word}-${poolIndex}`}
            type="button"
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", word)}
            onClick={() => place(word)}
            className="chip"
          >
            {word}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Drag or tap words into the slots. Tap a slot to send a word back.
      </p>
      {!checked ? (
        <button
          type="button"
          className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          onClick={() => setChecked(true)}
        >
          Check
        </button>
      ) : (
        <ResultBar
          correct={correct}
          explain={exercise.answer.join(" ").replace(/ ([.,!?;:])/g, "$1")}
          onNext={() => onResult(correct)}
          feedback={feedback}
        />
      )}
      {built.length ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{builtText}</p>
      ) : null}
    </div>
  );
}

function MatchingExercise({
  exercise,
  starred,
  onStar,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "matching" }>;
  starred: string[];
  onStar: (word: string) => void;
  onResult: (correct: boolean) => void;
  feedback: ReviewFeedback;
}) {
  const rights = useMemo(
    () =>
      seededShuffle(
        exercise.pairs.map((pair) => pair.right),
        `${exercise.id}-rights`,
      ),
    [exercise.id, exercise.pairs],
  );
  const [pendingLeft, setPendingLeft] = useState<string | null>(null);
  const [pendingRight, setPendingRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const usedRights = new Set(Object.values(matches));
  const complete = Object.keys(matches).length === exercise.pairs.length;
  const correct =
    complete &&
    exercise.pairs.every((pair) => matches[pair.left] === pair.right);
  const canConfirm = Boolean(pendingLeft && pendingRight);

  function confirmPair() {
    if (!pendingLeft || !pendingRight) return;
    setMatches((current) => ({ ...current, [pendingLeft]: pendingRight }));
    setPendingLeft(null);
    setPendingRight(null);
  }

  return (
    <div className="mt-6 grid gap-8 sm:grid-cols-2">
      <div className="grid gap-3">
        {exercise.pairs.map((pair) => {
          const active = pendingLeft === pair.left;
          const confirmed = Boolean(matches[pair.left]);
          return (
            <div key={pair.left} className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirmed) {
                    const right = matches[pair.left];
                    setMatches((current) => {
                      const next = { ...current };
                      delete next[pair.left];
                      return next;
                    });
                    setPendingLeft(pair.left);
                    setPendingRight(right ?? null);
                    return;
                  }
                  setPendingLeft(pair.left);
                }}
                className={`min-h-14 flex-1 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] ring-2 ring-[var(--accent)]"
                    : confirmed
                      ? "feedback-ok border-[var(--ok)]"
                      : "border-[var(--line)]"
                }`}
              >
                <span className={articleClass(pair.left)}>{pair.left}</span>
                {confirmed ? (
                  <span className="mt-2 block text-sm text-[var(--muted)]">
                    {matches[pair.left]}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                className="chip self-start"
                onClick={() => onStar(pair.left)}
                aria-label="Star word"
              >
                {starred.includes(pair.left) ? "★" : "☆"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3">
        {rights.map((right, rightIndex) => {
          const active = pendingRight === right;
          const used = usedRights.has(right);
          return (
            <button
              key={`${right}-${rightIndex}`}
              type="button"
              disabled={used && !active}
              onClick={() => setPendingRight(right)}
              className={`min-h-14 rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] ring-2 ring-[var(--accent)]"
                  : used
                    ? "border-[var(--line)] opacity-40"
                    : "border-[var(--line)]"
              }`}
            >
              {right}
            </button>
          );
        })}
      </div>
      <p className="text-sm leading-7 text-[var(--muted)] sm:col-span-2">
        Highlight a German word and an English meaning, then confirm the pair. The
        meaning appears only after you confirm.
      </p>
      {(canConfirm || complete) && !checked ? (
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          {canConfirm ? (
            <button
              type="button"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
              onClick={confirmPair}
            >
              Confirm pair
            </button>
          ) : null}
          {complete ? (
            <button
              type="button"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
              onClick={() => setChecked(true)}
            >
              Check
            </button>
          ) : null}
        </div>
      ) : null}
      {checked ? (
        <div className="sm:col-span-2">
          <ResultBar correct={correct} onNext={() => onResult(correct)} feedback={feedback} />
        </div>
      ) : null}
    </div>
  );
}

function ResultBar({
  correct,
  explain,
  onNext,
  feedback,
}: {
  correct: boolean;
  explain?: string;
  onNext: () => void;
  feedback: ReviewFeedback;
}) {
  const review = !correct ? feedback.review : null;
  const sameLesson = review?.id === feedback.currentLessonId;
  return (
    <div
      className={`mt-6 grid gap-4 rounded-2xl border px-5 py-4 ${
        correct ? "feedback-ok border-[var(--ok)]" : "feedback-bad border-[var(--danger)]"
      }`}
    >
      <div>
        <p className="font-medium">{correct ? "Nice." : "Not quite."}</p>
        {explain ? (
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{explain}</p>
        ) : null}
        {review ? (
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            This was taught in Lesson {String(review.number).padStart(2, "0")} · {review.title}.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        {review ? (
          sameLesson ? (
            <button type="button" className="chip" onClick={feedback.onReviewCurrent}>
              Review that lesson
            </button>
          ) : (
            <Link href={feedback.reviewHref(review.id)} className="chip">
              Review that lesson
            </Link>
          )
        ) : null}
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
