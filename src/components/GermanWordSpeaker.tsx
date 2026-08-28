"use client";

import { useEffect, useRef, useState } from "react";
import { blockedSpeakTarget, speakableFromPoint } from "@/lib/german-speak";
import { playGermanSpeech, stopGermanSpeech } from "@/lib/tts/playback";

type HoveredWord = {
  word: string;
  rects: Array<{ top: number; left: number; width: number; height: number }>;
};

export function GermanWordSpeaker({ speed }: { speed: number }) {
  const [hover, setHover] = useState<HoveredWord | null>(null);
  const [playing, setPlaying] = useState(false);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    function clear() {
      setHover(null);
    }

    function updateFromPoint(x: number, y: number) {
      const hit = speakableFromPoint(x, y);
      if (!hit) {
        clear();
        return;
      }
      setHover({
        word: hit.word,
        rects: hit.rects.map((rect) => ({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })),
      });
    }

    function onMove(event: PointerEvent) {
      updateFromPoint(event.clientX, event.clientY);
    }

    function onScroll() {
      clear();
    }

    async function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (blockedSpeakTarget(event.target)) return;
      const hit = speakableFromPoint(event.clientX, event.clientY);
      if (!hit) return;
      if (event.target instanceof Element && event.target.closest("a")) {
        event.preventDefault();
        event.stopPropagation();
      }
      setPlaying(true);
      try {
        await playGermanSpeech(hit.word, { speed: speedRef.current });
      } catch (error) {
        console.warn("[tts] word playback unavailable", error);
      } finally {
        setPlaying(false);
      }
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      stopGermanSpeech();
    };
  }, []);

  if (!hover) return null;

  return (
    <>
      {hover.rects.map((rect, index) => (
        <span
          key={`${hover.word}-${index}`}
          data-german-word-outline=""
          className={`german-word-outline${playing ? " is-playing" : ""}`}
          style={{
            top: rect.top - 3,
            left: rect.left - 3,
            width: rect.width + 6,
            height: rect.height + 6,
          }}
        />
      ))}
    </>
  );
}
