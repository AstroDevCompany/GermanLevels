"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/Providers";
import { playGermanSpeech } from "@/lib/tts/playback";
import type { ClientSpeechError } from "@/lib/tts/client";

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
  const tokenRef = useRef(0);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
    };
  }, [text]);

  if (!text.trim()) return null;

  async function play() {
    if (disabled || state === "loading" || state === "playing") return;
    const token = tokenRef.current + 1;
    tokenRef.current = token;
    setState("loading");
    try {
      await playGermanSpeech(text, {
        speed: prefs.speechRate,
        onStart: () => {
          if (token !== tokenRef.current) return;
          setState("playing");
          onPlay?.();
        },
      });
      if (token === tokenRef.current) setState("idle");
    } catch (error) {
      const code = (error as ClientSpeechError).code;
      console.warn("[tts] playback unavailable", code ?? "provider_error");
      if (token === tokenRef.current) setState("error");
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
      data-no-speak=""
      disabled={disabled || state === "loading" || state === "playing"}
      aria-busy={state === "loading"}
      aria-label={state === "error" ? "Speech unavailable" : `Play German audio: ${text}`}
    >
      {caption}
    </button>
  );
}
