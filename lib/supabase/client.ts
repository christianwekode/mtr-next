import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  browserClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}

export const FOLDER_COLUMNS = "id, name, slug, sort_order" as const;

export const TRANSCRIPTION_LIST_COLUMNS =
  "id, short_title, status, folder_id, recorded_at, session_key" as const;

export const TRANSCRIPTION_DETAIL_COLUMNS =
  "id, short_title, status, folder_id, recorded_at, session_key, body, language, duration_seconds, fragment_count, audio_storage_path, error_message" as const;

export const CHAT_LIST_COLUMNS = "id, title, active_transcription_id, created_at, updated_at" as const;

export const CHAT_MESSAGE_COLUMNS = "id, chat_id, role, content, created_at" as const;
