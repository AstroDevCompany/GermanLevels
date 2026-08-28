import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  return url;
}

export function sql() {
  return neon(getDatabaseUrl());
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        onboarding_completed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS user_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL DEFAULT '',
        accent TEXT NOT NULL DEFAULT 'teal',
        font_scale INTEGER NOT NULL DEFAULT 100,
        show_hints BOOLEAN NOT NULL DEFAULT true,
        article_colors BOOLEAN NOT NULL DEFAULT true,
        reduce_motion BOOLEAN NOT NULL DEFAULT false,
        daily_goal INTEGER NOT NULL DEFAULT 20,
        starting_level TEXT NOT NULL DEFAULT 'a1',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS user_progress (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS speech_rate DOUBLE PRECISION NOT NULL DEFAULT 0.92`;
      await db`CREATE TABLE IF NOT EXISTS tts_cache (
        cache_key TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        language TEXT NOT NULL,
        voice_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        speed DOUBLE PRECISION NOT NULL,
        output_format TEXT NOT NULL,
        status TEXT NOT NULL,
        error_code TEXT,
        character_count INTEGER NOT NULL DEFAULT 0,
        audio_base64 TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS tts_usage (
        id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        characters_sent BIGINT NOT NULL DEFAULT 0,
        cache_hits BIGINT NOT NULL DEFAULT 0,
        cache_misses BIGINT NOT NULL DEFAULT 0,
        generations BIGINT NOT NULL DEFAULT 0,
        errors BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await db`INSERT INTO tts_usage (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
      await db`CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token)`;
      await db`CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}
