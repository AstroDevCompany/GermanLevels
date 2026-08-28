import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/tts/generate";
import { TTS_MAX_CHARS } from "@/lib/tts/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: unknown;
      language?: unknown;
      speed?: unknown;
    };
    const text = typeof body.text === "string" ? body.text : "";
    if (!text.trim() || text.length > TTS_MAX_CHARS) {
      return NextResponse.json(
        { error: "That text cannot be spoken.", code: "invalid_request", fallback: true },
        { status: 400 },
      );
    }

    const result = await generateSpeech(text, {
      language: typeof body.language === "string" ? body.language : undefined,
      speed: typeof body.speed === "number" ? body.speed : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
          fallback: true,
        },
        { status: result.error.status },
      );
    }

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-TTS-Cache": result.cache,
        "X-TTS-Provider": result.provider,
      },
    });
  } catch (error) {
    console.error("[tts] endpoint error", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Speech is unavailable right now.", code: "provider_error", fallback: true },
      { status: 502 },
    );
  }
}
