import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSpeed, ttsCacheKey } from "./cache-key";
import { classifyProviderHttpError } from "./errors";
import { generateSpeech } from "./generate";
import { MemoryTtsStore } from "./memory-store";
import type { GenerateSpeechDeps, TtsProvider } from "./types";
import { TtsProviderError } from "./types";

const baseConfig = {
  apiKey: "test-key",
  voiceId: "voice-a",
  modelId: "eleven_flash_v2_5",
  outputFormat: "mp3_44100_128",
  language: "de",
  speed: 0.92,
  timeoutMs: 1_000,
};

function mockProvider(onCall?: () => Promise<void> | void): TtsProvider & { calls: number } {
  const provider = {
    id: "mock",
    calls: 0,
    async synthesize() {
      provider.calls += 1;
      await onCall?.();
      return Buffer.from("mock-mp3");
    },
  };
  return provider;
}

function deps(store: MemoryTtsStore, provider: TtsProvider, inflight?: Map<string, Promise<unknown>>): GenerateSpeechDeps {
  return {
    store,
    usage: store,
    provider,
    config: baseConfig,
    inflight: inflight as GenerateSpeechDeps["inflight"],
  };
}

describe("tts cache key", () => {
  it("changes when voice or speed changes", () => {
    const base = {
      text: "Guten Tag",
      language: "de",
      voiceId: "voice-a",
      modelId: "eleven_flash_v2_5",
      speed: normalizeSpeed(0.92),
      outputFormat: "mp3_44100_128",
    };
    const same = ttsCacheKey(base);
    const voice = ttsCacheKey({ ...base, voiceId: "voice-b" });
    const speed = ttsCacheKey({ ...base, speed: normalizeSpeed(1.1) });
    assert.notEqual(same, voice);
    assert.notEqual(same, speed);
    assert.equal(same, ttsCacheKey({ ...base }));
  });
});

describe("generateSpeech", () => {
  it("calls the provider once, then serves cache hits", async () => {
    const store = new MemoryTtsStore();
    const provider = mockProvider();
    const options = { voiceId: "voice-a", speed: 0.92 };
    const first = await generateSpeech("Hallo", options, deps(store, provider));
    const second = await generateSpeech("Hallo", options, deps(store, provider));
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.cache, "miss");
      assert.equal(second.cache, "hit");
    }
    assert.equal(provider.calls, 1);
    assert.equal(store.stats.cacheMisses, 1);
    assert.equal(store.stats.cacheHits, 1);
    assert.equal(store.stats.charactersSent, "Hallo".length);
  });

  it("does not generate again across 30 replays", async () => {
    const store = new MemoryTtsStore();
    const provider = mockProvider();
    const options = { voiceId: "voice-a", speed: 0.92 };
    for (let i = 0; i < 30; i += 1) {
      const result = await generateSpeech("Wiederholen", options, deps(store, provider));
      assert.equal(result.ok, true);
    }
    assert.equal(provider.calls, 1);
    assert.equal(store.stats.generations, 1);
    assert.equal(store.stats.cacheHits, 29);
  });

  it("dedupes simultaneous uncached requests", async () => {
    const store = new MemoryTtsStore();
    const provider = mockProvider(() => new Promise((resolve) => setTimeout(resolve, 60)));
    const options = { voiceId: "voice-a", speed: 0.92 };
    const shared = deps(store, provider);
    const [a, b] = await Promise.all([
      generateSpeech("Gleichzeitig", options, shared),
      generateSpeech("Gleichzeitig", options, shared),
    ]);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(provider.calls, 1);

    const twoInstances = new MemoryTtsStore();
    const slow = mockProvider(() => new Promise((resolve) => setTimeout(resolve, 80)));
    const [c, d] = await Promise.all([
      generateSpeech("Zwei Instanzen", options, { ...deps(twoInstances, slow), inflight: new Map() }),
      generateSpeech("Zwei Instanzen", options, { ...deps(twoInstances, slow), inflight: new Map() }),
    ]);
    assert.equal(c.ok, true);
    assert.equal(d.ok, true);
    assert.equal(slow.calls, 1);
  });

  it("creates a new cache entry for a different voice or speed", async () => {
    const store = new MemoryTtsStore();
    const provider = mockProvider();
    await generateSpeech("Danke", { voiceId: "voice-a", speed: 0.92 }, deps(store, provider));
    await generateSpeech("Danke", { voiceId: "voice-b", speed: 0.92 }, deps(store, provider));
    await generateSpeech("Danke", { voiceId: "voice-a", speed: 1.1 }, deps(store, provider));
    assert.equal(provider.calls, 3);
    assert.equal(store.rows.size, 3);
  });

  it("returns a controlled error and does not retry a quota failure", async () => {
    const store = new MemoryTtsStore();
    const provider: TtsProvider & { calls: number } = {
      id: "mock",
      calls: 0,
      async synthesize() {
        provider.calls += 1;
        throw new TtsProviderError("quota_exhausted", "Speech is temporarily unavailable.", 503);
      },
    };
    const options = { voiceId: "voice-a", speed: 0.92 };
    const first = await generateSpeech("Quota", options, deps(store, provider));
    const second = await generateSpeech("Quota", options, deps(store, provider));
    assert.equal(first.ok, false);
    assert.equal(second.ok, false);
    if (!first.ok) {
      assert.equal(first.error.code, "quota_exhausted");
      assert.equal(first.error.fallback, true);
    }
    assert.equal(provider.calls, 1);
  });
});

describe("provider error mapping", () => {
  it("maps quota and rate-limit responses", () => {
    assert.equal(classifyProviderHttpError(402, "payment_required"), "quota_exhausted");
    assert.equal(classifyProviderHttpError(429, "quota exceeded"), "quota_exhausted");
    assert.equal(classifyProviderHttpError(429, "too many requests"), "rate_limited");
    assert.equal(classifyProviderHttpError(500, "boom"), "provider_error");
  });
});
