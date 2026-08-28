"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SpeakButton } from "@/components/SpeakButton";
import type { Exercise } from "@/content/types";
import { normalizeAnswer } from "@/lib/german";
import { canListenToSpeech, keywordScore, listenGerman } from "@/lib/speech";

type Feedback = {
  review: { id: string; number: number; title: string } | null;
  currentLessonId: string;
  reviewHref: (id: string) => string;
  onReviewCurrent: () => void;
};

function Continue({
  correct,
  explain,
  extra,
  onNext,
}: {
  correct: boolean;
  explain?: string;
  extra?: ReactNode;
  onNext: () => void;
}) {
  return (
    <div
      className={`mt-6 grid gap-4 rounded-2xl border px-5 py-4 ${
        correct ? "feedback-ok border-[var(--ok)]" : "feedback-bad border-[var(--danger)]"
      }`}
    >
      <p className="font-medium">
        {correct ? "That would get you through the scene." : "Not quite — keep the key words and try the model."}
      </p>
      {explain ? <p className="text-sm leading-7 text-[var(--muted)]">{explain}</p> : null}
      {extra}
      <button
        type="button"
        className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
        onClick={onNext}
      >
        Continue
      </button>
    </div>
  );
}

export function ListenComprehensionExercise({
  exercise,
  onResult,
  feedback: _feedback,
}: {
  exercise: Extract<Exercise, { type: "listen-comprehension" }>;
  onResult: (correct: boolean, given: string) => void;
  feedback: Feedback;
}) {
  const [plays, setPlays] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const locked = picked !== null;
  const remaining = Math.max(0, exercise.maxPlays - plays);

  return (
    <div className="mt-6 grid gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
        <SpeakButton
          text={exercise.speak}
          label={remaining === exercise.maxPlays ? "Play once" : "Play again"}
          disabled={locked || remaining <= 0}
          onPlay={() => setPlays((value) => Math.min(exercise.maxPlays, value + 1))}
        />
        <p className="text-sm text-[var(--muted)]">
          {remaining} of {exercise.maxPlays} plays left · like the exam
        </p>
      </div>
      <p className="mt-2 font-medium leading-8">{exercise.question}</p>
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
                ? "feedback-ok border-[var(--ok)]"
                : bad
                  ? "feedback-bad border-[var(--danger)]"
                  : selected
                    ? "border-[var(--accent)]"
                    : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            {option}
          </button>
        );
      })}
      {locked ? (
        <Continue
          correct={picked === exercise.answer}
          explain={exercise.explain}
          onNext={() => onResult(picked === exercise.answer, picked ?? "")}
        />
      ) : null}
    </div>
  );
}

export function SpeakResponseExerciseView({
  exercise,
  onResult,
}: {
  exercise: Extract<Exercise, { type: "speak-response" }>;
  onResult: (correct: boolean, given: string) => void;
  feedback: Feedback;
}) {
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const given = transcript || typed;
  const score = keywordScore(given, exercise.keywords ?? [], exercise.sample);
  const correct = score >= 50 && given.trim().split(/\s+/).length >= 3;

  async function capture() {
    setError(null);
    setListening(true);
    const result = await listenGerman(Math.max(8000, (exercise.minSeconds ?? 3) * 2500));
    setListening(false);
    if (!result.ok) {
      setError(
        result.error === "unsupported"
          ? "This browser cannot listen. Say it out loud, then type what you said."
          : "I did not catch that. Try again or type.",
      );
      return;
    }
    setTranscript(result.transcript);
  }

  return (
    <div className="mt-5 grid gap-4">
      {exercise.situationDe ? (
        <p className="rounded-2xl border border-[var(--line)] px-4 py-3 leading-7">
          {exercise.situationDe}
          <span className="mt-1 block text-sm text-[var(--muted)]">{exercise.situation}</span>
        </p>
      ) : null}
      {exercise.speak ? (
        <div className="flex flex-wrap items-center gap-3">
          {showModel ? (
            <SpeakButton text={exercise.speak} label="Hear a model" />
          ) : (
            <button type="button" className="chip" onClick={() => setShowModel(true)}>
              Stuck? Hear a model once
            </button>
          )}
          <p className="text-sm text-[var(--muted)]">Answer in your own words first — the model is a last resort.</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[var(--accent-ink)]"
          onClick={() => void capture()}
          disabled={listening || checked}
        >
          {listening ? "Listening…" : canListenToSpeech() ? "Hold the floor — speak" : "Speak, then type"}
        </button>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {transcript ? (
        <p className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-7">
          Heard: {transcript}
        </p>
      ) : null}
      <textarea
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        rows={3}
        disabled={checked}
        className="w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
        placeholder="Or type what you said"
      />
      {!checked ? (
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-5 py-2"
          onClick={() => setChecked(true)}
          disabled={!given.trim()}
        >
          Check
        </button>
      ) : (
        <Continue
          correct={correct}
          explain={`Model: ${exercise.sample}`}
          extra={
            <p className="text-sm text-[var(--muted)]">
              Task language coverage {score}%. Aim for the key words, not a perfect recording.
            </p>
          }
          onNext={() => onResult(correct, given)}
        />
      )}
    </div>
  );
}

export function DialogueExerciseView({
  exercise,
  onResult,
}: {
  exercise: Extract<Exercise, { type: "dialogue" }>;
  onResult: (correct: boolean, given: string) => void;
  feedback: Feedback;
}) {
  const youTurns = exercise.turns.filter((turn) => turn.speaker === "you");
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [hits, setHits] = useState(0);
  const [lines, setLines] = useState<{ speaker: "npc" | "you"; de: string }[]>([]);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState(false);
  const [heardNpc, setHeardNpc] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const turn = exercise.turns[index];
  const done = index >= exercise.turns.length;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [index, lines]);

  useEffect(() => {
    setHeardNpc(false);
    setHint(false);
  }, [index]);

  function accept(text: string) {
    if (!turn || turn.speaker !== "you") return;
    const spoken = text.trim();
    if (!spoken) return;
    const needles = turn.keywords?.length ? turn.keywords : turn.de.split(/\s+/).slice(0, 3);
    const hay = normalizeAnswer(spoken);
    const ok = needles.filter((keyword) => hay.includes(normalizeAnswer(keyword))).length >= 1;
    setHits((current) => current + (ok ? 1 : 0));
    setLines((current) => [...current, { speaker: "you", de: spoken }]);
    setValue("");
    setIndex((current) => current + 1);
  }

  async function speakTurn() {
    setListening(true);
    const result = await listenGerman(10000);
    setListening(false);
    if (result.ok) accept(result.transcript);
  }

  if (done) {
    const passed = hits >= Math.max(1, Math.ceil(youTurns.length * 0.5));
    return (
      <Continue
        correct={passed}
        explain={`You kept ${hits} of ${youTurns.length} of your turns on task.`}
        extra={<p className="text-sm text-[var(--muted)]">{exercise.settingDe}</p>}
        onNext={() => onResult(passed, `${hits}/${youTurns.length}`)}
      />
    );
  }

  return (
    <div className="mt-5 grid gap-4">
      <p className="rounded-2xl border border-[var(--line)] px-4 py-3 leading-7">
        <span lang="de">{exercise.settingDe}</span>
        <span className="mt-1 block text-sm text-[var(--muted)]">{exercise.setting}</span>
      </p>
      <div ref={scroller} className="grid max-h-72 gap-2 overflow-auto rounded-2xl border border-[var(--line)] p-4">
        {lines.map((item, i) => (
          <p
            key={`${item.de}-${i}`}
            className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-6 ${
              item.speaker === "npc"
                ? "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
                : "ml-auto border border-[var(--line)]"
            }`}
          >
            <span className="text-xs text-[var(--muted)]">{item.speaker === "npc" ? "Gegenüber" : "Du"}</span>
            <span lang="de" className="mt-1 block">
              {item.de}
            </span>
          </p>
        ))}
        {turn?.speaker === "npc" ? (
          <p className="max-w-[90%] rounded-2xl bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-3 py-2 text-sm">
            <span className="text-xs text-[var(--muted)]">Gegenüber</span>
            <span lang="de" className="mt-1 block">
              {heardNpc ? turn.de : "…"}
            </span>
            <SpeakButton
              text={turn.de}
              className="mt-2"
              label="Play their line"
              onPlay={() => setHeardNpc(true)}
            />
            <button type="button" className="mt-2 block text-sm text-[var(--accent)]" onClick={() => setHeardNpc(true)}>
              Can't hear? Show the line
            </button>
          </p>
        ) : null}
      </div>
      {turn?.speaker === "npc" ? (
        <button
          type="button"
          className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
          disabled={!heardNpc}
          onClick={() => {
            setLines((current) => [...current, { speaker: "npc", de: turn.de }]);
            setIndex((current) => current + 1);
          }}
        >
          {heardNpc ? "I heard that — my turn" : "Play their line first"}
        </button>
      ) : (
        <div className="grid gap-3">
          {turn?.en ? (
            <div>
              <button type="button" className="text-sm text-[var(--accent)]" onClick={() => setHint((value) => !value)}>
                {hint ? "Hide hint" : "Need a hint?"}
              </button>
              {hint ? <p className="mt-1 text-sm text-[var(--muted)]">Aim: {turn.en}</p> : null}
            </div>
          ) : null}
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-[var(--line)] bg-transparent px-4 py-3 outline-none focus:border-[var(--accent)]"
            placeholder="Deine Zeile…"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-[var(--accent-ink)]"
              disabled={!value.trim()}
              onClick={() => accept(value)}
            >
              Say it
            </button>
            <button type="button" className="chip" disabled={listening} onClick={() => void speakTurn()}>
              {listening ? "Listening…" : "Speak"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
