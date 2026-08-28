import type { SpeechError, TtsErrorCode } from "@/lib/tts/types";

const MESSAGES: Record<TtsErrorCode, string> = {
  invalid_request: "That text cannot be spoken.",
  not_configured: "Speech is not configured yet.",
  quota_exhausted: "Speech is temporarily unavailable.",
  rate_limited: "Speech is busy right now. Try again in a moment.",
  timeout: "Speech took too long. Try again later.",
  provider_error: "Speech is unavailable right now.",
};

const STATUS: Record<TtsErrorCode, number> = {
  invalid_request: 400,
  not_configured: 503,
  quota_exhausted: 503,
  rate_limited: 429,
  timeout: 504,
  provider_error: 502,
};

export function speechError(code: TtsErrorCode, message?: string): SpeechError {
  return {
    code,
    message: message ?? MESSAGES[code],
    fallback: true,
    status: STATUS[code],
  };
}

export function classifyProviderHttpError(status: number, body: string): TtsErrorCode {
  const lower = body.toLowerCase();
  const quota =
    lower.includes("quota") ||
    lower.includes("credit") ||
    lower.includes("payment_required") ||
    (lower.includes("exceeded") && (lower.includes("limit") || lower.includes("usage")));
  if (status === 402 || quota) return "quota_exhausted";
  if (status === 429) return "rate_limited";
  if (status === 408 || status === 504) return "timeout";
  return "provider_error";
}
