export type TtsErrorCode =
  | "invalid_request"
  | "not_configured"
  | "quota_exhausted"
  | "rate_limited"
  | "timeout"
  | "provider_error";

export type GenerateSpeechOptions = {
  language?: string;
  voiceId?: string;
  modelId?: string;
  speed?: number;
  outputFormat?: string;
};

export type ResolvedSpeechRequest = {
  text: string;
  language: string;
  voiceId: string;
  modelId: string;
  speed: number;
  outputFormat: string;
};

export type SpeechError = {
  code: TtsErrorCode;
  message: string;
  fallback: true;
  status: number;
};

export type SpeechResult =
  | {
      ok: true;
      audio: Buffer;
      contentType: "audio/mpeg";
      cache: "hit" | "miss";
      cacheKey: string;
      provider: string;
    }
  | {
      ok: false;
      error: SpeechError;
      cacheKey?: string;
    };

export type TtsCacheStatus = "pending" | "ready" | "failed";

export type TtsCacheRecord = {
  cacheKey: string;
  status: TtsCacheStatus;
  audio: Buffer | null;
  errorCode: TtsErrorCode | null;
  updatedAt: number;
};

export type TtsUsageStats = {
  charactersSent: number;
  cacheHits: number;
  cacheMisses: number;
  generations: number;
  errors: number;
  updatedAt: string | null;
};

export interface TtsProvider {
  readonly id: string;
  synthesize(request: ResolvedSpeechRequest): Promise<Buffer>;
}

export interface TtsCacheStore {
  get(cacheKey: string): Promise<TtsCacheRecord | null>;
  tryBeginGeneration(
    cacheKey: string,
    request: ResolvedSpeechRequest,
  ): Promise<"acquired" | "exists">;
  saveAudio(cacheKey: string, audio: Buffer): Promise<void>;
  markFailed(cacheKey: string, errorCode: TtsErrorCode): Promise<void>;
  takeOverStale(cacheKey: string, staleMs: number): Promise<boolean>;
}

export interface TtsUsageStore {
  recordHit(): Promise<void>;
  recordMiss(characters: number): Promise<void>;
  recordError(): Promise<void>;
  getStats(): Promise<TtsUsageStats>;
}

export type GenerateSpeechDeps = {
  provider?: TtsProvider;
  store?: TtsCacheStore;
  usage?: TtsUsageStore;
  config?: Partial<TtsRuntimeConfig>;
  inflight?: Map<string, Promise<SpeechResult>>;
};

export type TtsRuntimeConfig = {
  apiKey: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  language: string;
  speed: number;
  timeoutMs: number;
};

export class TtsProviderError extends Error {
  readonly code: TtsErrorCode;
  readonly status: number;

  constructor(code: TtsErrorCode, message: string, status = 502) {
    super(message);
    this.name = "TtsProviderError";
    this.code = code;
    this.status = status;
  }
}
