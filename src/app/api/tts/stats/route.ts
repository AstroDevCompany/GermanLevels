import { NextResponse } from "next/server";
import { getTtsUsage } from "@/lib/tts/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getTtsUsage();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[tts] stats error", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Could not load TTS usage." }, { status: 500 });
  }
}
