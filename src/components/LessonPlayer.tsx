"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GermanChars, insertChar } from "@/components/GermanChars";
import { RevealList } from "@/components/RevealList";
import { SpeakButton } from "@/components/SpeakButton";
import { useApp } from "@/components/Providers";
import { getChapter } from "@/content/index";
import type { Exercise, Lesson, LessonPhase, LevelId, TeachCard } from "@/content/types";
import { answersMatch, articleClass, normalizeAnswer, seededShuffle } from "@/lib/german";
import { rubricLabel, scoreWriting } from "@/lib/writing-rubric";
import {
  DialogueExerciseView,
  ListenComprehensionExercise,
  SpeakResponseExerciseView,
} from "@/components/live-skills";
import { lessonKey } from "@/lib/progress";
import { findTaughtLesson, type TaughtLesson } from "@/lib/review";
import { injectTargetedExercises } from "@/lib/targeted";

const PHASE_LABEL: Record<LessonPhase, string> = {
  learn: "Learn",
  understand: "Understand",
  "controlled-practice": "Controlled practice",
  recall: "Recall",
  application: "Application",
  review: "Review",
};

function hintAnswer(answer: string | string[]): string {
  return Array.isArray(answer) ? String(answer[0] ?? "") : answer;
}

function nextHintValue(current: string, answer: string): string {
  if (!answer) return current;
  let matched = 0;
  const limit = Math.min(current.length, answer.length);
  while (matched < limit && current[matched] === answer[matched]) matched += 1;
  if (matched >= answer.length) return answer;
  return answer.slice(0, matched + 1);
}

function productionOk(text: string, exercise: Extract<Exercise, { type: "free-production" }>): boolean {
  if (exercise.rubric) return scoreWriting(text, exercise.rubric).passed;
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  const marks = text.match(/[.!?]/g)?.length ?? 0;
  const sentences = Math.max(marks, words.length >= 10 ? 2 : 1);
  if ((exercise.minSentences ?? 2) > sentences && words.length < 12) return false;
  if (exercise.keywords?.length) {
    const hits = exercise.keywords.filter((keyword) =>
      normalizeAnswer(text).includes(normalizeAnswer(keyword)),
    );
    return hits.length >= Math.min(2, exercise.keywords.length);
  }
  return true;
}

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
  practice?: boolean;
};

export function LessonPlayer({
  levelId,
  chapterSlug,
  chapterTitle,
  lesson,
  nextHref,
  practice = false,
}: Props) {
  const { prefs, completeLesson, saveLessonProgress, recordAnswer, starWord, progress } = useApp();
  const teaching = lesson.teaching ?? [];
  const chapterLessons = getChapter(levelId, chapterSlug)?.lessons ?? [];
  const [exercises] = useState(() =>
    practice ? lesson.exercises : injectTargetedExercises(lesson, progress.errors ?? {}),
  );
  const [phase, setPhase] = useState<"teach" | "quiz">(teaching.length ? "teach" : "quiz");
  const [teachIndex, setTeachIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [scored, setScored] = useState<Set<string>>(new Set());
  const [awarded, setAwarded] = useState(false);
  const exercise = exercises[index];
  const total = exercises.length;
  const teachTotal = teaching.length;
  const steps = Math.max(1, teachTotal + total);
  const step =
    phase === "teach" ? teachIndex + 1 : teachTotal + index + 1;
  const keepPassage =
    phase === "quiz" &&
    Boolean(lesson.passage) &&
    exercise?.type !== "listen-comprehension" &&
    exercise?.type !== "listen-choice" &&
    (lesson.skill === "reading" || lesson.skill === "mixed");
  const canGoBack =
    done ||
    (phase === "quiz" && (index > 0 || teachTotal > 0)) ||
    (phase === "teach" && teachIndex > 0);

  function persist(percent: number) {
    if (practice) return;
    saveLessonProgress({
      level: levelId,
      chapter: chapterSlug,
      lesson: lesson.id,
      percent,
    });
  }

  useEffect(() => {
    if (practice) return;
    saveLessonProgress({
      level: levelId,
      chapter: chapterSlug,
      lesson: lesson.id,
      percent: Math.round(((step - 1) / steps) * 100),
    });
  }, [levelId, chapterSlug, lesson.id]);

  function onResult(correct: boolean, given: string) {
    const id = exercise.id;
    recordAnswer({
      exercise,
      given,
      correct,
      lessonKey: lessonKey(levelId, chapterSlug, lesson.id),
    });
    if (!scored.has(id)) {
      setScored((current) => new Set(current).add(id));
      if (correct) setScore((value) => value + 1);
    }
    const nextScore = scored.has(id) ? score : score + (correct ? 1 : 0);
    if (index + 1 >= total) {
      setDone(true);
      if (!awarded) {
        setAwarded(true);
        if (!practice) {
          completeLesson({
            level: levelId,
            chapter: chapterSlug,
            lesson: lesson.id,
            score: nextScore,
            total,
          });
        }
      }
    } else {
      setIndex((value) => value + 1);
      persist(Math.round(((teachTotal + index + 1) / steps) * 100));
    }
  }

  function onTeachContinue() {
    const nextTeach = teachIndex + 1;
    if (nextTeach >= teachTotal) {
      setPhase("quiz");
      persist(Math.round((teachTotal / steps) * 100));
    } else {
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
    const ratio = total ? score / total : 0;
    const headline =
      chapterSlug === "conversations"
        ? "Scene survived."
        : chapterSlug === "exam"
          ? "Paper in."
          : lesson.skill === "speaking"
            ? "You took the floor."
            : lesson.skill === "listening"
              ? "Caught in two plays."
              : lesson.skill === "writing"
                ? "Text on the page."
                : "Lesson complete";
    const blurb =
      chapterSlug === "conversations"
        ? `You stayed in German for ${score} of ${total} beats. That is how a café, a phone, or a neighbour actually goes.`
        : chapterSlug === "exam"
          ? `Section score ${score} / ${total}. In the room you would only feel the clock.`
          : `You scored ${score} / ${total}${practice ? " on targeted review." : " on the practice."}${
              ratio >= 0.8 ? " Solid enough to reuse tomorrow." : " Replay the misses before they fossilise."
            }`;
    return (
      <section className="lesson-step rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-10">
        <p className="text-sm text-[var(--muted)]">{chapterTitle}</p>
        <h1 className="mt-3 text-3xl font-semibold">{headline}</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          {blurb}
          {progress.lastXp ? (
            <>
              {" "}
              +{progress.lastXp.lesson} XP
              {progress.lastXp.streak
                ? ` and +${progress.lastXp.streak} XP for your weekly streak.`
                : "."}
            </>
          ) : null}
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
              {chapterSlug === "conversations"
                ? "Another scene"
                : chapterSlug === "exam"
                  ? "Next paper"
                  : "Next lesson"}
            </Link>
          ) : null}
          <Link
            href={
              chapterSlug === "conversations"
                ? "/conversations"
                : chapterSlug === "exam"
                  ? `/exam/${levelId}`
                  : `/courses/${levelId}/${chapterSlug}`
            }
            className="chip"
          >
            {chapterSlug === "conversations"
              ? "All conversations"
              : chapterSlug === "exam"
                ? "All papers"
                : "Back to chapter"}
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
          {practice
            ? "Targeted review"
            : chapterSlug === "exam"
              ? `Paper ${lesson.number} of 4`
              : chapterSlug === "conversations"
                ? "Conversation scene"
                : `Lesson ${lesson.number} of ${chapterLessons.length || 20}${lesson.role ? ` · ${lesson.role}` : ""}`}
        </p>
        <p className="mt-2 text-sm capitalize text-[var(--muted)]">{lesson.skill}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">{lesson.summary}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {phase === "teach"
            ? PHASE_LABEL[teaching[teachIndex]?.phase ?? "learn"]
            : PHASE_LABEL[exercise?.phase ?? "controlled-practice"]}
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
  starred,
  onStar,
  isLast,
  canGoBack,
  onBack,
  onContinue,
}: {
  card: TeachCard;
  starred: string[];
  onStar: (word: string) => void;
  isLast: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const promptSide = card.phase === "recall" ? "en" : "de";
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">{card.eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">{card.title}</h2>
      {card.titleDe ? <p className="mt-2 text-[var(--muted)]">{card.titleDe}</p> : null}
      {card.body ? <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">{card.body}</p> : null}

      {card.speak && (card.kind === "reading" || card.kind === "model" || card.kind === "situation") ? (
        <div className="mt-6">
          <SpeakButton text={card.speak} />
          <p className="reading-serif mt-4 whitespace-pre-wrap text-lg leading-8">{card.speak}</p>
        </div>
      ) : card.speak ? (
        <div className="mt-6">
          <SpeakButton text={card.speak} />
        </div>
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
        <RevealList
          rows={card.rows}
          prompt={promptSide}
          starred={starred}
          onStar={onStar}
        />
      ) : null}

      {card.translation ? (
        <div className="mt-6">
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={() => setShowTranslation((value) => !value)}
          >
            {showTranslation ? "Hide English" : "Show English"}
          </button>
          {showTranslation ? (
            <p className="mt-3 max-w-2xl whitespace-pre-wrap leading-7 text-[var(--muted)]">
              {card.translation}
            </p>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">English stays hidden until you ask.</p>
          )}
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
  onResult: (correct: boolean, given: string) => void;
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
      {exercise.targeted ? (
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">Targeted review</p>
      ) : null}
      <h2 className={`${exercise.targeted ? "mt-3 " : ""}text-lg font-medium leading-8`}>
        {"promptDe" in exercise && exercise.promptDe ? exercise.promptDe : exercise.prompt}
      </h2>
      {"promptDe" in exercise && exercise.promptDe && exercise.promptDe !== exercise.prompt ? (
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{exercise.prompt}</p>
      ) : null}
      {exercise.type === "multiple-choice" || exercise.type === "listen-choice" ? (
        <ChoiceExercise
          exercise={exercise}
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
      {exercise.type === "free-production" ? (
        <FreeProductionExercise exercise={exercise} onResult={onResult} feedback={feedback} />
      ) : null}
      {exercise.type === "listen-comprehension" ? (
        <ListenComprehensionExercise exercise={exercise} onResult={onResult} feedback={feedback} />
      ) : null}
      {exercise.type === "speak-response" ? (
        <SpeakResponseExerciseView exercise={exercise} onResult={onResult} feedback={feedback} />
      ) : null}
      {exercise.type === "dialogue" ? (
        <DialogueExerciseView exercise={exercise} onResult={onResult} feedback={feedback} />
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
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "multiple-choice" | "listen-choice" }>;
  onResult: (correct: boolean, given: string) => void;
  feedback: ReviewFeedback;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const locked = picked !== null;
  const listenOnly = exercise.type === "listen-choice";
  return (
    <div className="mt-6 grid gap-3">
      {exercise.speak ? (
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <SpeakButton text={exercise.speak} />
          {listenOnly ? (
            <p className="text-sm text-[var(--muted)]">Listen, then choose the meaning.</p>
          ) : null}
        </div>
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
          onNext={() => onResult(picked === exercise.answer, picked ?? "")}
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
  onResult: (correct: boolean, given: string) => void;
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
                  ? "feedback-ok"
                  : "feedback-bad"
                : picked !== null && value === exercise.answer
                  ? "feedback-ok"
                  : ""
            }`}
            aria-pressed={picked === value}
            data-selected={picked === value}
          >
            {value ? "True" : "False"}
          </button>
        ))}
      </div>
      {picked !== null ? (
        <ResultBar
          correct={picked === exercise.answer}
          explain={exercise.explain}
          onNext={() => onResult(picked === exercise.answer, picked ? "true" : "false")}
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
  onResult: (correct: boolean, given: string) => void;
  feedback: ReviewFeedback;
}) {
  const [value, setValue] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
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
              className="chip"
              aria-pressed={placed === option}
              data-selected={placed === option}
              onClick={() => setPlaced(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      {exercise.hint ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={() => setShowMeaning((value) => !value)}
          >
            {showMeaning ? "Hide meaning" : "Show meaning"}
          </button>
          {showMeaning ? <p className="mt-2 text-sm text-[var(--muted)]">{exercise.hint}</p> : null}
        </div>
      ) : null}
      <GermanChars
        disabled={checked}
        onInsert={(char) => {
          setPlaced(null);
          setValue((current) => insertChar(placed ?? current, char, inputRef.current));
        }}
      />
      {!checked ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
            onClick={() => setChecked(true)}
          >
            Check
          </button>
          {showHints ? (
            <button
              type="button"
              className="chip"
              disabled={given === hintAnswer(exercise.answer)}
              onClick={() => {
                const next = nextHintValue(given, hintAnswer(exercise.answer));
                setPlaced(null);
                setValue(next);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              aria-label="Reveal the next letter"
            >
              Hint
            </button>
          ) : null}
        </div>
      ) : (
        <ResultBar
          correct={correct}
          explain={Array.isArray(exercise.answer) ? exercise.answer[0] : exercise.answer}
          onNext={() => onResult(correct, given)}
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
  onResult: (correct: boolean, given: string) => void;
  feedback: ReviewFeedback;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
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
      {exercise.hint ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={() => setShowHint((value) => !value)}
          >
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint ? <p className="mt-2 text-sm text-[var(--muted)]">{exercise.hint}</p> : null}
        </div>
      ) : null}
      {!checked ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
            onClick={() => setChecked(true)}
          >
            Check
          </button>
          {showHints ? (
            <button
              type="button"
              className="chip"
              disabled={value === hintAnswer(exercise.answer)}
              onClick={() => {
                const next = nextHintValue(value, hintAnswer(exercise.answer));
                setValue(next);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              aria-label="Reveal the next letter"
            >
              Hint
            </button>
          ) : null}
        </div>
      ) : (
        <ResultBar
          correct={correct}
          explain={Array.isArray(exercise.answer) ? exercise.answer.join(" / ") : exercise.answer}
          onNext={() => onResult(correct, value)}
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
  onResult: (correct: boolean, given: string) => void;
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
          onNext={() => onResult(correct, builtText)}
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
  onResult: (correct: boolean, given: string) => void;
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
  const ownerOf = (right: string) =>
    Object.entries(matches).find(([, value]) => value === right)?.[0];
  const complete = Object.keys(matches).length === exercise.pairs.length;
  const correct =
    complete &&
    exercise.pairs.every((pair) => matches[pair.left] === pair.right);

  function pairTone(left: string) {
    const index = exercise.pairs.findIndex((pair) => pair.left === left);
    return String(((index >= 0 ? index : 0) % 8));
  }

  function commit(left: string, right: string) {
    setMatches((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(next)) {
        if (value === right) delete next[key];
      }
      next[left] = right;
      return next;
    });
    setPendingLeft(null);
    setPendingRight(null);
  }

  function pickLeft(left: string) {
    if (matches[left]) {
      setMatches((current) => {
        const next = { ...current };
        delete next[left];
        return next;
      });
      setPendingLeft(left);
      setPendingRight(null);
      return;
    }
    if (pendingRight) {
      commit(left, pendingRight);
      return;
    }
    setPendingLeft(left === pendingLeft ? null : left);
  }

  function pickRight(right: string) {
    const owner = ownerOf(right);
    if (owner && !pendingLeft) {
      setMatches((current) => {
        const next = { ...current };
        delete next[owner];
        return next;
      });
      return;
    }
    if (pendingLeft) {
      commit(pendingLeft, right);
      return;
    }
    setPendingRight(right === pendingRight ? null : right);
  }

  function pairClass(left: string | undefined, active: boolean, confirmed: boolean) {
    if (checked && confirmed && left) {
      const good = exercise.pairs.some((pair) => pair.left === left && matches[left] === pair.right);
      return good
        ? "feedback-ok border-[var(--ok)]"
        : "feedback-bad border-[var(--danger)]";
    }
    if (confirmed && left) return `match-pair`;
    if (active) {
      return "border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] ring-2 ring-[var(--accent)]";
    }
    return "border-[var(--line)]";
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
                onClick={() => pickLeft(pair.left)}
                data-pair={confirmed ? pairTone(pair.left) : undefined}
                className={`min-h-14 flex-1 rounded-2xl border px-4 py-3 text-left transition ${pairClass(pair.left, active, confirmed)}`}
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
          const owner = ownerOf(right);
          const active = pendingRight === right;
          const confirmed = Boolean(owner);
          return (
            <button
              key={`${right}-${rightIndex}`}
              type="button"
              onClick={() => pickRight(right)}
              data-pair={owner ? pairTone(owner) : undefined}
              className={`min-h-14 rounded-2xl border px-4 py-3 text-left transition ${pairClass(owner, active, confirmed)}`}
            >
              {right}
            </button>
          );
        })}
      </div>
      <p className="text-sm leading-7 text-[var(--muted)] sm:col-span-2">
        Tap a German word, then its meaning. The pair is saved and shares a color.
        Tap a pair to undo.
      </p>
      {complete && !checked ? (
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="button"
            className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
            onClick={() => setChecked(true)}
          >
            Check
          </button>
        </div>
      ) : null}
      {checked ? (
        <div className="sm:col-span-2">
          <ResultBar
            correct={correct}
            onNext={() =>
              onResult(
                correct,
                exercise.pairs.map((pair) => `${pair.left}=${matches[pair.left] ?? ""}`).join("; "),
              )
            }
            feedback={feedback}
          />
        </div>
      ) : null}
    </div>
  );
}

function FreeProductionExercise({
  exercise,
  onResult,
  feedback,
}: {
  exercise: Extract<Exercise, { type: "free-production" }>;
  onResult: (correct: boolean, given: string) => void;
  feedback: ReviewFeedback;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const rubric = exercise.rubric ? scoreWriting(value, exercise.rubric) : null;
  const correct = productionOk(value, exercise);
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  const under = Boolean(exercise.rubric && words < exercise.rubric.minWords);
  return (
    <div className="mt-5">
      {exercise.rubric ? (
        <p className="mb-3 text-sm text-[var(--muted)]">
          Ziel: etwa {exercise.rubric.targetWords ?? exercise.rubric.minWords} Wörter
          {exercise.rubric.register ? ` · ${exercise.rubric.register}` : ""}. Scored like a
          certificate paper: Inhalt, Aufbau, Wortschatz, Korrektheit.
        </p>
      ) : null}
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={exercise.rubric && (exercise.rubric.minWords ?? 0) >= 70 ? 10 : 5}
        className="w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        placeholder="Write in German — full sentences, not keywords."
      />
      <p className={`mt-2 text-xs ${under ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
        {words} Wörter
        {exercise.rubric ? ` · Ziel ${exercise.rubric.minWords}–${exercise.rubric.targetWords ?? exercise.rubric.minWords}` : ""}
      </p>
      {exercise.hints?.length ? (
        <div className="mt-3">
          <button
            type="button"
            className="text-sm text-[var(--accent)]"
            onClick={() => setShowHelp((value) => !value)}
          >
            {showHelp ? "Hide hints" : "Show hints"}
          </button>
          {showHelp ? (
            <ul className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
              {exercise.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
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
        <div>
          {rubric ? (
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {(["content", "cohesion", "vocabulary", "accuracy"] as const).map((key) => (
                <li key={key} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <span className="text-[var(--muted)]">{rubricLabel(key)}</span>
                  <span className="mt-1 block font-medium">{rubric[key]}%</span>
                </li>
              ))}
            </ul>
          ) : null}
          {rubric?.notes.length ? (
            <ul className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
              {rubric.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Model: {exercise.sample}
          </p>
          <ResultBar
            correct={correct}
            explain={
              rubric
                ? `Overall ${rubric.overall}% · ${rubric.wordCount} words. Raters split content, cohesion, vocabulary, and accuracy — not keyword luck.`
                : correct
                  ? "Your sentences include the key pieces. Compare with the model."
                  : "Use the model to try again next time. Aim for two short German sentences."
            }
            onNext={() => onResult(correct, value)}
            feedback={feedback}
          />
        </div>
      )}
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
        <p className="font-medium">{correct ? "On track." : "Not quite."}</p>
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
