import { classifyProviderHttpError, speechError } from "@/lib/tts/errors";
import type { ResolvedSpeechRequest, TtsProvider } from "@/lib/tts/types";
import { TtsProviderError } from "@/lib/tts/types";

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export class ElevenLabsProvider implements TtsProvider {
  readonly id = "elevenlabs";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {}

  async synthesize(request: ResolvedSpeechRequest): Promise<Buffer> {
    if (!this.apiKey) {
      throw new TtsProviderError("not_configured", "Speech is not configured yet.", 503);
    }

    const url = `${ELEVENLABS_URL}/${encodeURIComponent(request.voiceId)}?output_format=${encodeURIComponent(request.outputFormat)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.modelId,
          language_code: request.language,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            speed: request.speed,
          },
        }),
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new TtsProviderError("timeout", "Speech took too long. Try again later.", 504);
      }
      throw new TtsProviderError("provider_error", "Speech is unavailable right now.", 502);
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const code = classifyProviderHttpError(response.status, body);
      console.error("[tts] elevenlabs error", { status: response.status, code });
      const mapped = speechError(code);
      throw new TtsProviderError(mapped.code, mapped.message, mapped.status);
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length) {
      throw new TtsProviderError("provider_error", "Speech is unavailable right now.", 502);
    }
    return audio;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
