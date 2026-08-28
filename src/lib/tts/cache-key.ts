import { createHash } from "crypto";
import type { ResolvedSpeechRequest } from "@/lib/tts/types";

export const MIN_SPEECH_SPEED = 0.7;
export const MAX_SPEECH_SPEED = 1.2;

export function normalizeSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1;
  const clamped = Math.min(MAX_SPEECH_SPEED, Math.max(MIN_SPEECH_SPEED, speed));
  return Math.round(clamped * 100) / 100;
}

export function ttsCacheKey(request: ResolvedSpeechRequest): string {
  const canonical = [
    request.text,
    request.language,
    request.voiceId,
    request.modelId,
    String(normalizeSpeed(request.speed)),
    request.outputFormat,
  ].join("\u001f");
  return createHash("sha256").update(canonical).digest("hex");
}
