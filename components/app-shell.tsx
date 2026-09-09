"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatPane } from "@/components/chat-pane";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { TranscriptionPane } from "@/components/transcription-pane";
import { toUiMessages } from "@/lib/message";
import {
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

function isStatus(value: string): value is TranscriptionStatus {
  return value === "processing" || value === "ready" || value === "failed";
}

function asListItem(row: Record<string, unknown>): TranscriptionListItem | null {
  if (typeof row.id !== "string") return null;
  const status = typeof row.status === "string" && isStatus(row.status) ? row.status : "processing";
  return {
    id: row.id,
    short_title: typeof row.short_title === "string" ? row.short_title : null,
    status,
    folder_id: typeof row.folder_id === "string" ? row.folder_id : null,
    recorded_at: typeof row.recorded_at === "string" ? row.recorded_at : new Date().toISOString(),
    session_key: typeof row.session_key === "string" ? row.session_key : row.id,
  };
}

export function AppShell() {
  const [query, setQuery] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [transcriptions, setTranscriptions] = useState<TranscriptionListItem[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paneHidden, setPaneHidden] = useState(false);
  const [detail, setDetail] = useState<TranscriptionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [bootError, setBootError] = useState<string | null>(null);

  const selectedIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));

  const { messages, setMessages, sendMessage, status } = useChat({ transport });

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null;
  const showTranscriptionPane = Boolean(selectedId) && !paneHidden;
  const paneDetail = selectedId && detail?.id === selectedId ? detail : null;
  const paneLoading = Boolean(selectedId) && detailLoading;
  const selectedFolderName =
    folders.find(
      (folder) =>
        folder.id ===
        (paneDetail?.folder_id ?? transcriptions.find((item) => item.id === selectedId)?.folder_id),
    )?.name ?? null;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadDetail = useCallback(async (id: string) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    setDetailLoading(true);

    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("mtr_transcriptions")
        .select(TRANSCRIPTION_DETAIL_COLUMNS)
        .eq("id", id)
        .abortSignal(controller.signal)
        .single();
      if (controller.signal.aborted) return;
      if (error) throw new Error(error.message);
      setDetail(data as TranscriptionDetail);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setDetail(null);
    } finally {
      if (!controller.signal.aborted) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const supabase = getSupabaseBrowser();
        const [folderRes, listRes, chatRes] = await Promise.all([
          supabase.from("mtr_folders").select("id, name, slug, sort_order").order("sort_order", { ascending: true }),
          supabase
            .from("mtr_transcriptions")
            .select(TRANSCRIPTION_LIST_COLUMNS)
            .order("recorded_at", { ascending: false }),
          supabase.from("mtr_chats").select("id, title, active_transcription_id, created_at, updated_at").order("updated_at", {
            ascending: false,
          }),
        ]);

        if (folderRes.error) throw new Error(folderRes.error.message);
        if (listRes.error) throw new Error(listRes.error.message);
        if (chatRes.error) throw new Error(chatRes.error.message);
        if (cancelled) return;

        const nextFolders = (folderRes.data ?? []) as Folder[];
        const nextList = (listRes.data ?? []) as TranscriptionListItem[];
        const loadedChats = (chatRes.data ?? []) as ChatRow[];
        const emptyChatIds = loadedChats.filter((chat) => !chat.title?.trim()).map((chat) => chat.id);
        if (emptyChatIds.length > 0) {
          await supabase.from("mtr_chats").delete().in("id", emptyChatIds);
        }
        if (cancelled) return;

        setFolders(nextFolders);
        setTranscriptions(nextList);
        setChats(loadedChats.filter((chat) => Boolean(chat.title?.trim())));
        setExpandedFolderIds(
          new Set(
            nextFolders
              .filter((folder) => nextList.some((item) => item.folder_id === folder.id))
              .map((folder) => folder.id),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          setBootError(error instanceof Error ? error.message : "No se pudo cargar el workspace");
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser>;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      return;
    }

    const channel = supabase
      .channel("mtr-transcriptions-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mtr_transcriptions" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            if (!id) return;
            setTranscriptions((current) => current.filter((item) => item.id !== id));
            return;
          }

          const item = asListItem(payload.new as Record<string, unknown>);
          if (!item) return;
          setTranscriptions((current) => {
            const index = current.findIndex((row) => row.id === item.id);
            if (index === -1) {
              return [item, ...current];
            }
            const next = [...current];
            next[index] = { ...next[index], ...item };
            return next;
          });
          if (
            item.id === selectedIdRef.current &&
            (item.status === "ready" || item.status === "failed")
          ) {
            void loadDetail(item.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadDetail]);

  const refreshChats = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("mtr_chats")
      .select("id, title, active_transcription_id, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setChats(data as ChatRow[]);
  }, []);

  const ensureChat = useCallback(
    async (activeTranscriptionId: string | null) => {
      if (currentChatId) {
        await getSupabaseBrowser()
          .from("mtr_chats")
          .update({ active_transcription_id: activeTranscriptionId })
          .eq("id", currentChatId);
        await refreshChats();
        return currentChatId;
      }

      const { data, error } = await getSupabaseBrowser()
        .from("mtr_chats")
        .insert({ active_transcription_id: activeTranscriptionId })
        .select("id, title, active_transcription_id, created_at, updated_at")
        .single();
      if (error || !data) {
        throw new Error(error?.message ?? "No se pudo crear el chat");
      }
      setCurrentChatId(data.id);
      await refreshChats();
      return data.id;
    },
    [currentChatId, refreshChats],
  );

  const handleSelectTranscription = useCallback(
    (id: string) => {
      if (selectedId === id) {
        setSelectedId(null);
        setPaneHidden(false);
        return;
      }

      setSelectedId(id);
      setPaneHidden(false);
      setDetailLoading(true);
      void loadDetail(id);
    },
    [loadDetail, selectedId],
  );

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
    setSelectedId(null);
    setPaneHidden(false);
  }, [setMessages]);

  const handleSelectChat = useCallback(
    async (id: string) => {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("mtr_chat_messages")
        .select("id, chat_id, role, content, created_at")
        .eq("chat_id", id)
        .order("created_at", { ascending: true });
      if (error) return;

      setCurrentChatId(id);
      setMessages(toUiMessages((data ?? []) as ChatMessageRow[]));
    },
    [setMessages],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const chatId = await ensureChat(selectedId);
      await sendMessage(
        { text },
        {
          body: {
            chatId,
            activeTranscriptionId: selectedId,
          },
        },
      );
      window.setTimeout(() => {
        void refreshChats();
      }, 1200);
    },
    [ensureChat, refreshChats, selectedId, sendMessage],
  );

  const handleAttachAudio = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAudioChosen = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const form = new FormData();
    form.set("file", file);
    await fetch("/api/transcribe", { method: "POST", body: form });
  }, []);

  if (bootError) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white px-6 text-[13px] text-[#141414BD]">
        {bootError}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-white text-[13px] text-[#141414] antialiased">
      <Topbar query={query} onQueryChange={setQuery} />
      <div className="flex min-h-0 min-w-0 grow">
        <Sidebar
          folders={folders}
          transcriptions={transcriptions}
          query={query}
          selectedId={selectedId}
          expandedFolderIds={expandedFolderIds}
          onToggleFolder={(id) => {
            setExpandedFolderIds((current) => {
              const next = new Set(current);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onSelect={(id) => {
            void handleSelectTranscription(id);
          }}
        />
        {showTranscriptionPane ? (
          <>
            <TranscriptionPane folderName={selectedFolderName} detail={paneDetail} loading={paneLoading} />
            <ChatPane
              variant="sidebar"
              chats={chats}
              currentChat={currentChat}
              messages={messages}
              status={status}
              hasTranscription={Boolean(selectedId)}
              showTranscriptionPane={showTranscriptionPane}
              onToggleLayout={() => setPaneHidden(true)}
              onNewChat={handleNewChat}
              onSelectChat={(id) => {
                void handleSelectChat(id);
              }}
              onSend={(text) => {
                void handleSend(text);
              }}
              onAttachAudio={handleAttachAudio}
            />
          </>
        ) : (
          <ChatPane
            variant="full"
            chats={chats}
            currentChat={currentChat}
            messages={messages}
            status={status}
            hasTranscription={Boolean(selectedId)}
            showTranscriptionPane={showTranscriptionPane}
            onToggleLayout={() => {
              if (selectedId) setPaneHidden(false);
            }}
            onNewChat={handleNewChat}
            onSelectChat={(id) => {
              void handleSelectChat(id);
            }}
            onSend={(text) => {
              void handleSend(text);
            }}
            onAttachAudio={handleAttachAudio}
          />
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.mp4"
        className="hidden"
        onChange={(event) => {
          void handleAudioChosen(event);
        }}
      />
    </div>
  );
}
