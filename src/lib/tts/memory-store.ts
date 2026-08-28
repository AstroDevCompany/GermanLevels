import type {
  ResolvedSpeechRequest,
  TtsCacheRecord,
  TtsCacheStore,
  TtsErrorCode,
  TtsUsageStats,
  TtsUsageStore,
} from "@/lib/tts/types";

export class MemoryTtsStore implements TtsCacheStore, TtsUsageStore {
  readonly rows = new Map<string, TtsCacheRecord>();
  stats: TtsUsageStats = {
    charactersSent: 0,
    cacheHits: 0,
    cacheMisses: 0,
    generations: 0,
    errors: 0,
    updatedAt: null,
  };

  async get(cacheKey: string): Promise<TtsCacheRecord | null> {
    const row = this.rows.get(cacheKey);
    if (!row) return null;
    return {
      ...row,
      audio: row.audio ? Buffer.from(row.audio) : null,
    };
  }

  async tryBeginGeneration(
    cacheKey: string,
    _request: ResolvedSpeechRequest,
  ): Promise<"acquired" | "exists"> {
    const current = this.rows.get(cacheKey);
    if (!current || current.status === "failed") {
      this.rows.set(cacheKey, {
        cacheKey,
        status: "pending",
        audio: null,
        errorCode: null,
        updatedAt: Date.now(),
      });
      return "acquired";
    }
    return "exists";
  }

  async saveAudio(cacheKey: string, audio: Buffer): Promise<void> {
    this.rows.set(cacheKey, {
      cacheKey,
      status: "ready",
      audio: Buffer.from(audio),
      errorCode: null,
      updatedAt: Date.now(),
    });
  }

  async markFailed(cacheKey: string, errorCode: TtsErrorCode): Promise<void> {
    this.rows.set(cacheKey, {
      cacheKey,
      status: "failed",
      audio: null,
      errorCode,
      updatedAt: Date.now(),
    });
  }

  async takeOverStale(cacheKey: string, staleMs: number): Promise<boolean> {
    const current = this.rows.get(cacheKey);
    if (!current) return false;
    const stale = current.status === "failed" || Date.now() - current.updatedAt >= staleMs;
    if (!stale) return false;
    this.rows.set(cacheKey, {
      cacheKey,
      status: "pending",
      audio: null,
      errorCode: null,
      updatedAt: Date.now(),
    });
    return true;
  }

  async recordHit(): Promise<void> {
    this.stats.cacheHits += 1;
    this.stats.updatedAt = new Date().toISOString();
  }

  async recordMiss(characters: number): Promise<void> {
    this.stats.cacheMisses += 1;
    this.stats.generations += 1;
    this.stats.charactersSent += Math.max(0, characters);
    this.stats.updatedAt = new Date().toISOString();
  }

  async recordError(): Promise<void> {
    this.stats.errors += 1;
    this.stats.updatedAt = new Date().toISOString();
  }

  async getStats(): Promise<TtsUsageStats> {
    return { ...this.stats };
  }
}
