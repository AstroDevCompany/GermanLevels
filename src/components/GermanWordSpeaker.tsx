"use client";

import { useEffect, useRef, useState } from "react";
import { blockedSpeakTarget, speakableFromPoint } from "@/lib/german-speak";
import { playGermanSpeech, stopGermanSpeech } from "@/lib/tts/playback";

type WordBox = {
  word: string;
  rects: Array<{ top: number; left: number; width: number; height: number }>;
};

type SpeakStatus = "idle" | "loading" | "playing" | "error";

export function GermanWordSpeaker({ speed }: { speed: number }) {
  const [hover, setHover] = useState<WordBox | null>(null);
  const [active, setActive] = useState<WordBox | null>(null);
  const [status, setStatus] = useState<SpeakStatus>("idle");
  const speedRef = useRef(speed);
  const statusRef = useRef(status);
  speedRef.current = speed;
  statusRef.current = status;

  useEffect(() => {
    function updateFromPoint(x: number, y: number) {
      const hit = speakableFromPoint(x, y);
      if (!hit) {
        setHover(null);
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
      setHover(null);
      if (statusRef.current === "idle") setActive(null);
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
      const box: WordBox = {
        word: hit.word,
        rects: hit.rects.map((rect) => ({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })),
      };
      setActive(box);
      setStatus("loading");
      try {
        await playGermanSpeech(hit.word, {
          speed: speedRef.current,
          onStart: () => setStatus("playing"),
        });
        setStatus("idle");
        setActive(null);
      } catch (error) {
        console.warn("[tts] word playback unavailable", error);
        setStatus("error");
        window.setTimeout(() => {
          setStatus("idle");
          setActive(null);
        }, 2200);
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

  const shown = hover ?? (status !== "idle" ? active : null);
  const label =
    status === "loading"
      ? `Loading “${active?.word ?? ""}”…`
      : status === "playing"
        ? `Playing “${active?.word ?? ""}”`
        : status === "error"
          ? "Couldn’t play that word"
          : "";
  const anchor = (active ?? shown)?.rects[0];

  return (
    <>
      <div className="sr-only" aria-live="polite">
        {label}
      </div>
      {shown?.rects.map((rect, index) => (
        <span
          key={`${shown.word}-${index}`}
          data-german-word-outline=""
          className={`german-word-outline${status === "loading" ? " is-loading" : ""}${status === "playing" ? " is-playing" : ""}`}
          style={{
            top: rect.top - 2,
            left: rect.left - 2,
            width: rect.width + 4,
            height: rect.height + 4,
          }}
        />
      ))}
      {status !== "idle" && anchor ? (
        <div
          className={`german-word-status german-word-status-${status}`}
          role="status"
          style={{
            top: Math.min(typeof window === "undefined" ? 0 : window.innerHeight - 44, anchor.top + anchor.height + 8),
            left: Math.min(typeof window === "undefined" ? 0 : window.innerWidth - 220, Math.max(8, anchor.left)),
          }}
        >
          {status === "loading" ? <span className="german-word-spinner" aria-hidden /> : null}
          {label}
        </div>
      ) : null}
    </>
  );
}
