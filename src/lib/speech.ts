import { normalizeAnswer } from "@/lib/german";

export type SpeechListenResult =
  | { ok: true; transcript: string }
  | { ok: false; error: "unsupported" | "denied" | "empty" | "failed" };

type RecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const speech = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return speech.SpeechRecognition ?? speech.webkitSpeechRecognition ?? null;
}

export function canListenToSpeech(): boolean {
  return Boolean(recognitionCtor());
}

export function listenGerman(maxMs = 12_000): Promise<SpeechListenResult> {
  const Ctor = recognitionCtor();
  if (!Ctor) return Promise.resolve({ ok: false, error: "unsupported" });
  return new Promise((resolve) => {
    const rec = new Ctor();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let finished = false;
    const done = (result: SpeechListenResult) => {
      if (finished) return;
      finished = true;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      resolve(result);
    };
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      done(transcript ? { ok: true, transcript } : { ok: false, error: "empty" });
    };
    rec.onerror = () => done({ ok: false, error: "failed" });
    rec.onend = () => {
      if (!finished) done({ ok: false, error: "empty" });
    };
    try {
      rec.start();
    } catch {
      done({ ok: false, error: "denied" });
      return;
    }
    window.setTimeout(() => rec.stop(), maxMs);
  });
}

export function keywordScore(transcript: string, keywords: string[], sample?: string): number {
  const hay = normalizeAnswer(transcript);
  const needles = (keywords.length ? keywords : sample ? sample.split(/\s+/).slice(0, 6) : []).map((item) =>
    normalizeAnswer(item),
  );
  if (!needles.length) return transcript.trim().split(/\s+/).length >= 3 ? 70 : 0;
  const hits = needles.filter((needle) => needle.length > 1 && hay.includes(needle)).length;
  return Math.round((hits / Math.min(needles.length, 4)) * 100);
}
