"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { truncateTitle } from "@/lib/format";
import { mentionFocus, toTitleText } from "@/lib/mentions";
import {
  createChat,
  deleteChats,
  fetchChatMessages,
  fetchTranscriptionDetail,
  fetchWorkspace,
  subscribeTranscriptions,
} from "@/lib/mtr";
import { toUiMessages } from "@/lib/message";
import type { ChatRow, Folder, TranscriptionDetail, TranscriptionListItem } from "@/lib/types";

export function useWorkspace() {
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

  const showTranscriptionPane = Boolean(selectedId) && !paneHidden;
  const paneDetail = selectedId && detail?.id === selectedId ? detail : null;
  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null;
  const selectedFolderName =
    folders.find(
      (folder) =>
        folder.id === (paneDetail?.folder_id ?? transcriptions.find((item) => item.id === selectedId)?.folder_id),
    )?.name ?? null;

  const loadDetail = useCallback(async (id: string) => {
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    setDetailLoading(true);

    try {
      const next = await fetchTranscriptionDetail(id, controller.signal);
      if (controller.signal.aborted) return;
      setDetail(next);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setDetail(null);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const next = await fetchWorkspace();
        if (cancelled) return;

        const emptyChatIds = next.chats.filter((chat) => !chat.title?.trim()).map((chat) => chat.id);
        if (emptyChatIds.length > 0) {
          await deleteChats(emptyChatIds);
        }
        if (cancelled) return;

        setFolders(next.folders);
        setTranscriptions(next.transcriptions);
        setChats(next.chats.filter((chat) => Boolean(chat.title?.trim())));
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
    try {
      return subscribeTranscriptions((event) => {
        if (event.type === "DELETE") {
          setTranscriptions((current) => current.filter((item) => item.id !== event.id));
          if (event.id === selectedIdRef.current) {
            selectedIdRef.current = null;
            setSelectedId(null);
            setDetail(null);
            setPaneHidden(false);
          }
          return;
        }

        const item = event.item;
        setTranscriptions((current) => {
          const index = current.findIndex((row) => row.id === item.id);
          if (index === -1) return [item, ...current];
          const next = [...current];
          next[index] = { ...next[index], ...item };
          return next;
        });
        if (item.id === selectedIdRef.current && (item.status === "ready" || item.status === "failed")) {
          void loadDetail(item.id);
        }
      });
    } catch {
      return undefined;
    }
  }, [loadDetail]);

  const openTranscription = useCallback(
    (id: string) => {
      selectedIdRef.current = id;
      setSelectedId(id);
      setPaneHidden(false);
      setExpandedFolderIds((current) => {
        const folderId = transcriptions.find((item) => item.id === id)?.folder_id;
        if (!folderId || current.has(folderId)) return current;
        const next = new Set(current);
        next.add(folderId);
        return next;
      });
      void loadDetail(id);
    },
    [loadDetail, transcriptions],
  );

  const selectTranscription = useCallback(
    (id: string) => {
      if (selectedId === id) {
        selectedIdRef.current = null;
        setSelectedId(null);
        setPaneHidden(false);
        return;
      }
      openTranscription(id);
    },
    [openTranscription, selectedId],
  );

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openFolder = useCallback((id: string) => {
    setExpandedFolderIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const handleMentionClick = useCallback(
    (id: string, kind: "transcription" | "folder") => {
      if (kind === "folder") {
        openFolder(id);
        return;
      }
      openTranscription(id);
    },
    [openFolder, openTranscription],
  );

  const ensureChat = useCallback(async () => {
    if (currentChatId) return currentChatId;

    const created = await createChat(selectedId);
    setCurrentChatId(created.id);
    setChats((current) => [created, ...current]);
    return created.id;
  }, [currentChatId, selectedId]);

  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
    selectedIdRef.current = null;
    setSelectedId(null);
    setPaneHidden(false);
  }, [setMessages]);

  const handleSelectChat = useCallback(
    async (id: string) => {
      try {
        const rows = await fetchChatMessages(id);
        setCurrentChatId(id);
        setMessages(toUiMessages(rows));
      } catch {
        return;
      }
    },
    [setMessages],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const chatId = await ensureChat();
      const now = new Date().toISOString();
      setChats((current) => {
        const next = current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: chat.title?.trim() ? chat.title : truncateTitle(toTitleText(text)),
                updated_at: now,
              }
            : chat,
        );
        const index = next.findIndex((chat) => chat.id === chatId);
        if (index <= 0) return next;
        const [row] = next.splice(index, 1);
        return [row, ...next];
      });
      await sendMessage(
        { text },
        {
          body: {
            chatId,
            ...mentionFocus(text, selectedId),
          },
        },
      );
    },
    [ensureChat, selectedId, sendMessage],
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

  return {
    query,
    setQuery,
    folders,
    transcriptions,
    chats,
    selectedId,
    expandedFolderIds,
    bootError,
    showTranscriptionPane,
    paneDetail,
    detailLoading: Boolean(selectedId) && detailLoading,
    selectedFolderName,
    currentChat,
    messages,
    status,
    fileInputRef,
    selectTranscription,
    openTranscription,
    handleMentionClick,
    toggleFolder,
    togglePane: () => setPaneHidden((hidden) => !hidden),
    handleNewChat,
    handleSelectChat,
    handleSend,
    handleAttachAudio,
    handleAudioChosen,
  };
}
