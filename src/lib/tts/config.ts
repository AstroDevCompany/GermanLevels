import { normalizeSpeed } from "@/lib/tts/cache-key";
import type { TtsRuntimeConfig } from "@/lib/tts/types";

export const DEFAULT_TTS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
export const DEFAULT_TTS_MODEL_ID = "eleven_flash_v2_5";
export const DEFAULT_TTS_OUTPUT_FORMAT = "mp3_44100_128";
export const DEFAULT_TTS_LANGUAGE = "de";
export const DEFAULT_TTS_SPEED = 0.92;
export const TTS_TIMEOUT_MS = 15_000;
export const TTS_MAX_CHARS = 2_500;

export function readTtsConfig(): TtsRuntimeConfig {
  return {
    apiKey: process.env.ELEVENLABS_API_KEY?.trim() ?? "",
    voiceId: process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_TTS_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_TTS_MODEL_ID,
    outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT?.trim() || DEFAULT_TTS_OUTPUT_FORMAT,
    language: process.env.TTS_LANGUAGE?.trim() || DEFAULT_TTS_LANGUAGE,
    speed: normalizeSpeed(Number(process.env.TTS_SPEED) || DEFAULT_TTS_SPEED),
    timeoutMs: TTS_TIMEOUT_MS,
  };
}
