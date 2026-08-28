"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Providers";
import { requestSpeechUrl, type ClientSpeechError } from "@/lib/tts/client";

type SpeakState = "idle" | "loading" | "playing" | "error";

export function SpeakButton({
  text,
  className = "",
  label = "Listen",
  onPlay,
  disabled = false,
}: {
  text: string;
  className?: string;
  label?: string;
  onPlay?: () => void;
  disabled?: boolean;
}) {
  const { prefs } = useApp();
  const [state, setState] = useState<SpeakState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [text]);

  if (!text.trim()) return null;

  async function play() {
    if (disabled || state === "loading" || state === "playing") return;
    audioRef.current?.pause();
    setState("loading");
    try {
      const url = await requestSpeechUrl(text, {
        speed: prefs.speechRate,
        language: "de",
      });
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("error");
      await audio.play();
      setState("playing");
      onPlay?.();
    } catch (error) {
      const code = (error as ClientSpeechError).code;
      console.warn("[tts] playback unavailable", code ?? "provider_error");
      setState("error");
    }
  }

  const caption =
    state === "loading" ? "Loading…" : state === "playing" ? "Playing" : state === "error" ? "Unavailable" : label;

  return (
    <button
      type="button"
      className={`chip shrink-0 ${className}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void play();
      }}
      disabled={disabled || state === "loading" || state === "playing"}
      aria-busy={state === "loading"}
      aria-label={state === "error" ? "Speech unavailable" : `Play German audio: ${text}`}
    >
      {caption}
    </button>
  );
}
