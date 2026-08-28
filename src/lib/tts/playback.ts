import { requestSpeechUrl } from "@/lib/tts/client";

let current: HTMLAudioElement | null = null;
let currentToken = 0;
let settleCurrent: (() => void) | null = null;

export function stopGermanSpeech() {
  currentToken += 1;
  settleCurrent?.();
  settleCurrent = null;
  current?.pause();
  current = null;
}

export async function playGermanSpeech(
  text: string,
  options: { speed?: number; onStart?: () => void } = {},
): Promise<void> {
  const spoken = text.trim();
  if (!spoken) return;
  const token = currentToken + 1;
  currentToken = token;
  settleCurrent?.();
  settleCurrent = null;
  current?.pause();
  current = null;

  const url = await requestSpeechUrl(spoken, {
    speed: options.speed ?? 0.92,
    language: "de",
  });
  if (token !== currentToken) return;

  const audio = new Audio(url);
  current = audio;
  options.onStart?.();
  await audio.play();
  if (token !== currentToken) {
    audio.pause();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const done = () => {
      if (settleCurrent === done) settleCurrent = null;
      if (current === audio) current = null;
      resolve();
    };
    settleCurrent = done;
    audio.onended = done;
    audio.onerror = () => {
      if (settleCurrent === done) settleCurrent = null;
      if (current === audio) current = null;
      reject(new Error("playback failed"));
    };
  });
}
