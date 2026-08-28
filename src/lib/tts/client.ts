export type ClientSpeechError = {
  code: string;
  message: string;
  fallback: true;
};

const blobCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export function clientSpeechKey(text: string, speed: number, language = "de"): string {
  return `${text}\u001f${language}\u001f${speed}`;
}

export async function requestSpeechUrl(
  text: string,
  options: { speed?: number; language?: string } = {},
): Promise<string> {
  const speed = options.speed ?? 0.92;
  const language = options.language ?? "de";
  const key = clientSpeechKey(text, speed, language);
  const cached = blobCache.get(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchSpeechBlob(text, { speed, language })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      blobCache.set(key, url);
      return url;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

async function fetchSpeechBlob(
  text: string,
  options: { speed: number; language: string },
): Promise<Blob> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language: options.language,
      speed: options.speed,
    }),
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("audio")) {
    const payload = await readError(response);
    const error = new Error(payload.message) as Error & ClientSpeechError;
    error.code = payload.code;
    error.message = payload.message;
    error.fallback = true;
    throw error;
  }
  return response.blob();
}

async function readError(response: Response): Promise<ClientSpeechError> {
  try {
    const body = (await response.json()) as {
      code?: string;
      error?: string;
      fallback?: boolean;
    };
    return {
      code: body.code ?? "provider_error",
      message: body.error ?? "Speech is unavailable right now.",
      fallback: true,
    };
  } catch {
    return {
      code: "provider_error",
      message: "Speech is unavailable right now.",
      fallback: true,
    };
  }
}
