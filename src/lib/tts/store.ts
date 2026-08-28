import { ensureSchema, sql } from "@/lib/db";
import type {
  ResolvedSpeechRequest,
  TtsCacheRecord,
  TtsCacheStatus,
  TtsCacheStore,
  TtsErrorCode,
  TtsUsageStats,
  TtsUsageStore,
} from "@/lib/tts/types";

type CacheRow = {
  cache_key: string;
  status: TtsCacheStatus;
  audio_base64: string | null;
  error_code: string | null;
  updated_at: string | Date;
};

function asRecord(row: CacheRow): TtsCacheRecord {
  return {
    cacheKey: row.cache_key,
    status: row.status,
    audio: row.audio_base64 ? Buffer.from(row.audio_base64, "base64") : null,
    errorCode: (row.error_code as TtsErrorCode | null) ?? null,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export class NeonTtsStore implements TtsCacheStore, TtsUsageStore {
  async get(cacheKey: string): Promise<TtsCacheRecord | null> {
    await ensureSchema();
    const db = sql();
    const rows = (await db`SELECT cache_key, status, audio_base64, error_code, updated_at
      FROM tts_cache WHERE cache_key = ${cacheKey} LIMIT 1`) as CacheRow[];
    return rows[0] ? asRecord(rows[0]) : null;
  }

  async tryBeginGeneration(
    cacheKey: string,
    request: ResolvedSpeechRequest,
  ): Promise<"acquired" | "exists"> {
    await ensureSchema();
    const db = sql();
    const inserted = (await db`INSERT INTO tts_cache (
        cache_key, text, language, voice_id, model_id, speed, output_format,
        status, character_count, created_at, updated_at
      ) VALUES (
        ${cacheKey}, ${request.text}, ${request.language}, ${request.voiceId},
        ${request.modelId}, ${request.speed}, ${request.outputFormat},
        'pending', ${request.text.length}, now(), now()
      )
      ON CONFLICT (cache_key) DO NOTHING
      RETURNING cache_key`) as { cache_key: string }[];
    if (inserted[0]) return "acquired";

    const current = await this.get(cacheKey);
    if (!current || current.status === "ready") return "exists";
    if (current.status === "pending") return "exists";
    return (await this.takeOverStale(cacheKey, 45_000)) ? "acquired" : "exists";
  }

  async saveAudio(cacheKey: string, audio: Buffer): Promise<void> {
    await ensureSchema();
    const db = sql();
    const audioBase64 = audio.toString("base64");
    await db`UPDATE tts_cache
      SET status = 'ready', audio_base64 = ${audioBase64}, error_code = NULL, updated_at = now()
      WHERE cache_key = ${cacheKey}`;
  }

  async markFailed(cacheKey: string, errorCode: TtsErrorCode): Promise<void> {
    await ensureSchema();
    const db = sql();
    await db`UPDATE tts_cache
      SET status = 'failed', error_code = ${errorCode}, updated_at = now()
      WHERE cache_key = ${cacheKey}`;
  }

  async takeOverStale(cacheKey: string, staleMs: number): Promise<boolean> {
    await ensureSchema();
    const db = sql();
    const cutoff = new Date(Date.now() - staleMs).toISOString();
    const rows = (await db`UPDATE tts_cache
      SET status = 'pending', audio_base64 = NULL, error_code = NULL, updated_at = now()
      WHERE cache_key = ${cacheKey}
        AND (
          status = 'failed'
          OR (status = 'pending' AND updated_at < ${cutoff}::timestamptz)
        )
      RETURNING cache_key`) as { cache_key: string }[];
    return Boolean(rows[0]);
  }

  async recordHit(): Promise<void> {
    await this.bump({ cacheHits: 1 });
  }

  async recordMiss(characters: number): Promise<void> {
    await this.bump({ cacheMisses: 1, generations: 1, charactersSent: Math.max(0, characters) });
  }

  async recordError(): Promise<void> {
    await this.bump({ errors: 1 });
  }

  async getStats(): Promise<TtsUsageStats> {
    await ensureSchema();
    const db = sql();
    const rows = (await db`SELECT characters_sent, cache_hits, cache_misses, generations, errors, updated_at
      FROM tts_usage WHERE id = 1 LIMIT 1`) as {
      characters_sent: number | string;
      cache_hits: number | string;
      cache_misses: number | string;
      generations: number | string;
      errors: number | string;
      updated_at: string | Date | null;
    }[];
    const row = rows[0];
    return {
      charactersSent: Number(row?.characters_sent ?? 0),
      cacheHits: Number(row?.cache_hits ?? 0),
      cacheMisses: Number(row?.cache_misses ?? 0),
      generations: Number(row?.generations ?? 0),
      errors: Number(row?.errors ?? 0),
      updatedAt: row?.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  }

  private async bump(delta: {
    cacheHits?: number;
    cacheMisses?: number;
    generations?: number;
    charactersSent?: number;
    errors?: number;
  }) {
    await ensureSchema();
    const db = sql();
    const cacheHits = delta.cacheHits ?? 0;
    const cacheMisses = delta.cacheMisses ?? 0;
    const generations = delta.generations ?? 0;
    const charactersSent = delta.charactersSent ?? 0;
    const errors = delta.errors ?? 0;
    await db`UPDATE tts_usage SET
      cache_hits = cache_hits + ${cacheHits},
      cache_misses = cache_misses + ${cacheMisses},
      generations = generations + ${generations},
      characters_sent = characters_sent + ${charactersSent},
      errors = errors + ${errors},
      updated_at = now()
      WHERE id = 1`;
  }
}

export const neonTtsStore = new NeonTtsStore();
