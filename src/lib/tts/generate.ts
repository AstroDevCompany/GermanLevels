import { ttsCacheKey, normalizeSpeed } from "@/lib/tts/cache-key";
import { TTS_MAX_CHARS, readTtsConfig } from "@/lib/tts/config";
import { ElevenLabsProvider } from "@/lib/tts/elevenlabs";
import { speechError } from "@/lib/tts/errors";
import { neonTtsStore } from "@/lib/tts/store";
import type {
  GenerateSpeechDeps,
  GenerateSpeechOptions,
  ResolvedSpeechRequest,
  SpeechError,
  SpeechResult,
  TtsCacheStore,
  TtsErrorCode,
  TtsProvider,
  TtsRuntimeConfig,
} from "@/lib/tts/types";
import { TtsProviderError } from "@/lib/tts/types";

const defaultInflight = new Map<string, Promise<SpeechResult>>();
const recentFailures = new Map<string, { at: number; result: SpeechResult }>();
const FAILURE_COOLDOWN_MS = 8_000;
const STALE_LOCK_MS = 45_000;
const WAIT_FOR_PARTNER_MS = 8_000;

export async function generateSpeech(
  text: string,
  options: GenerateSpeechOptions = {},
  deps: GenerateSpeechDeps = {},
): Promise<SpeechResult> {
  const resolved = resolveRequest(text, options, deps.config);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  const request = resolved.request;
  const cacheKey = ttsCacheKey(request);
  const inflight = deps.inflight ?? defaultInflight;
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const promise = synthesizeWithCache(request, cacheKey, deps).finally(() => {
    inflight.delete(cacheKey);
  });
  inflight.set(cacheKey, promise);
  return promise;
}

async function synthesizeWithCache(
  request: ResolvedSpeechRequest,
  cacheKey: string,
  deps: GenerateSpeechDeps,
): Promise<SpeechResult> {
  const store = deps.store ?? neonTtsStore;
  const usage = deps.usage ?? neonTtsStore;
  const config = { ...readTtsConfig(), ...deps.config };

  const cached = await store.get(cacheKey);
  if (cached?.status === "ready" && cached.audio) {
    await usage.recordHit();
    logUsage("hit", cacheKey, request.text.length);
    return success(cached.audio, "hit", cacheKey, providerId(deps.provider));
  }

  const recent = recentFailures.get(cacheKey);
  if (recent && Date.now() - recent.at < FAILURE_COOLDOWN_MS) {
    return recent.result;
  }

  const lock = await store.tryBeginGeneration(cacheKey, request);
  if (lock === "exists") {
    const partner = await waitForReady(store, cacheKey, WAIT_FOR_PARTNER_MS);
    if (partner?.status === "ready" && partner.audio) {
      await usage.recordHit();
      logUsage("hit", cacheKey, request.text.length);
      return success(partner.audio, "hit", cacheKey, providerId(deps.provider));
    }
    if (partner?.status === "failed") {
      return fail(partner.errorCode ?? "provider_error", cacheKey);
    }
    const tookOver = await store.takeOverStale(cacheKey, STALE_LOCK_MS);
    if (!tookOver) {
      return fail("timeout", cacheKey);
    }
  }

  const provider = deps.provider ?? createDefaultProvider(config);
  if (!provider) {
    await store.markFailed(cacheKey, "not_configured");
    return rememberFailure(cacheKey, fail("not_configured", cacheKey));
  }

  try {
    const audio = await provider.synthesize(request);
    await store.saveAudio(cacheKey, audio);
    await usage.recordMiss(request.text.length);
    logUsage("miss", cacheKey, request.text.length);
    return success(audio, "miss", cacheKey, provider.id);
  } catch (error) {
    const mapped = mapProviderError(error);
    await store.markFailed(cacheKey, mapped.error.code);
    await usage.recordError();
    console.error("[tts] generation failed", { code: mapped.error.code, cacheKey });
    return rememberFailure(cacheKey, mapped);
  }
}

function createDefaultProvider(config: TtsRuntimeConfig): TtsProvider | null {
  if (!config.apiKey) return null;
  return new ElevenLabsProvider(config.apiKey, config.timeoutMs);
}

function resolveRequest(
  text: string,
  options: GenerateSpeechOptions,
  configOverride?: Partial<TtsRuntimeConfig>,
): { ok: true; request: ResolvedSpeechRequest } | { ok: false; error: SpeechError } {
  const config = { ...readTtsConfig(), ...configOverride };
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: speechError("invalid_request") };
  }
  if (trimmed.length > TTS_MAX_CHARS) {
    return { ok: false, error: speechError("invalid_request") };
  }
  const language = (options.language ?? config.language).trim().toLowerCase();
  if (!/^[a-z]{2,8}$/.test(language)) {
    return { ok: false, error: speechError("invalid_request") };
  }
  return {
    ok: true,
    request: {
      text: trimmed,
      language,
      voiceId: (options.voiceId ?? config.voiceId).trim(),
      modelId: (options.modelId ?? config.modelId).trim(),
      speed: normalizeSpeed(options.speed ?? config.speed),
      outputFormat: (options.outputFormat ?? config.outputFormat).trim(),
    },
  };
}

async function waitForReady(
  store: TtsCacheStore,
  cacheKey: string,
  timeoutMs: number,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const row = await store.get(cacheKey);
    if (row && row.status !== "pending") return row;
    await sleep(80);
  }
  return store.get(cacheKey);
}

function success(
  audio: Buffer,
  cache: "hit" | "miss",
  cacheKey: string,
  provider: string,
): SpeechResult {
  return {
    ok: true,
    audio,
    contentType: "audio/mpeg",
    cache,
    cacheKey,
    provider,
  };
}

function fail(code: TtsErrorCode, cacheKey: string): SpeechResult {
  return { ok: false, error: speechError(code), cacheKey };
}

function rememberFailure(cacheKey: string, result: SpeechResult): SpeechResult {
  recentFailures.set(cacheKey, { at: Date.now(), result });
  return result;
}

function mapProviderError(error: unknown): Extract<SpeechResult, { ok: false }> {
  if (error instanceof TtsProviderError) {
    return { ok: false, error: speechError(error.code, error.message) };
  }
  return { ok: false, error: speechError("provider_error") };
}

function providerId(provider?: TtsProvider): string {
  return provider?.id ?? "elevenlabs";
}

function logUsage(cache: "hit" | "miss", cacheKey: string, characters: number) {
  console.info("[tts]", { cache, characters, key: cacheKey.slice(0, 12) });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTtsUsage(deps: Pick<GenerateSpeechDeps, "usage"> = {}) {
  const usage = deps.usage ?? neonTtsStore;
  return usage.getStats();
}
