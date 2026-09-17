import {
  CHAT_LIST_COLUMNS,
  CHAT_MESSAGE_COLUMNS,
  FOLDER_COLUMNS,
  getSupabaseBrowser,
  TRANSCRIPTION_DETAIL_COLUMNS,
  TRANSCRIPTION_LIST_COLUMNS,
} from "@/lib/supabase/client";
import type {
  ChatMessageRow,
  ChatRow,
  Folder,
  TranscriptionDetail,
  TranscriptionListItem,
  TranscriptionStatus,
} from "@/lib/types";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStatus(value: unknown): TranscriptionStatus {
  return value === "ready" || value === "failed" || value === "processing" ? value : "processing";
}

export function parseTranscriptionListItem(row: unknown): TranscriptionListItem | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = asString(value.id);
  if (!id) return null;
  return {
    id,
    short_title: asString(value.short_title),
    status: asStatus(value.status),
    folder_id: asString(value.folder_id),
    recorded_at: asString(value.recorded_at) ?? new Date().toISOString(),
    session_key: asString(value.session_key) ?? id,
  };
}

export async function fetchWorkspace() {
  const supabase = getSupabaseBrowser();
  const [folderRes, listRes, chatRes] = await Promise.all([
    supabase.from("mtr_folders").select(FOLDER_COLUMNS).order("sort_order", { ascending: true }),
    supabase.from("mtr_transcriptions").select(TRANSCRIPTION_LIST_COLUMNS).order("recorded_at", { ascending: false }),
    supabase.from("mtr_chats").select(CHAT_LIST_COLUMNS).order("updated_at", { ascending: false }),
  ]);

  if (folderRes.error) throw new Error(folderRes.error.message);
  if (listRes.error) throw new Error(listRes.error.message);
  if (chatRes.error) throw new Error(chatRes.error.message);

  return {
    folders: (folderRes.data ?? []) as Folder[],
    transcriptions: (listRes.data ?? []) as TranscriptionListItem[],
    chats: (chatRes.data ?? []) as ChatRow[],
  };
}

export async function deleteChats(ids: string[]) {
  if (ids.length === 0) return;
  await getSupabaseBrowser().from("mtr_chats").delete().in("id", ids);
}

export async function fetchTranscriptionDetail(id: string, signal: AbortSignal) {
  const { data, error } = await getSupabaseBrowser()
    .from("mtr_transcriptions")
    .select(TRANSCRIPTION_DETAIL_COLUMNS)
    .eq("id", id)
    .abortSignal(signal)
    .single();
  if (error) throw new Error(error.message);
  return data as TranscriptionDetail;
}

export async function createChat(activeTranscriptionId: string | null) {
  const { data, error } = await getSupabaseBrowser()
    .from("mtr_chats")
    .insert({ active_transcription_id: activeTranscriptionId })
    .select(CHAT_LIST_COLUMNS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear el chat");
  }
  return data as ChatRow;
}

function folderSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "carpeta"
  );
}

export async function createFolder(name: string, sortOrder: number) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("El nombre de la carpeta no puede estar vacío");

  const supabase = getSupabaseBrowser();
  const base = folderSlug(trimmed);
  let slug = base;
  let attempt = 1;

  while (attempt <= 8) {
    const { data, error } = await supabase
      .from("mtr_folders")
      .insert({ name: trimmed, slug, sort_order: sortOrder })
      .select(FOLDER_COLUMNS)
      .single();

    if (!error && data) return data as Folder;

    const duplicate = error?.code === "23505" || /duplicate|unique/i.test(error?.message ?? "");
    if (!duplicate || attempt === 8) {
      throw new Error(error?.message ?? "No se pudo crear la carpeta");
    }
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  throw new Error("No se pudo crear la carpeta");
}

export async function fetchChatMessages(chatId: string) {
  const { data, error } = await getSupabaseBrowser()
    .from("mtr_chat_messages")
    .select(CHAT_MESSAGE_COLUMNS)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessageRow[];
}

export function subscribeTranscriptions(
  onEvent: (event: { type: "DELETE"; id: string } | { type: "UPSERT"; item: TranscriptionListItem }) => void,
): () => void {
  const supabase = getSupabaseBrowser();
  const channel = supabase
    .channel("mtr-transcriptions-list")
    .on("postgres_changes", { event: "*", schema: "public", table: "mtr_transcriptions" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const id = asString((payload.old as { id?: unknown }).id);
        if (id) onEvent({ type: "DELETE", id });
        return;
      }
      const item = parseTranscriptionListItem(payload.new);
      if (item) onEvent({ type: "UPSERT", item });
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
