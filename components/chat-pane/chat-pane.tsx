"use client";

import type { UIMessage } from "ai";
import { useRef, useState } from "react";
import { ChatHeader } from "@/components/chat-pane/chat-header";
import { EmptyConversation } from "@/components/chat-pane/empty-conversation";
import { MessageList } from "@/components/chat-pane/message-list";
import { Composer } from "@/components/composer/composer";
import type { MentionKind } from "@/lib/mentions";
import type { ChatRow, Folder, TranscriptionListItem } from "@/lib/types";

export type ChatPaneProps = {
  variant: "full" | "sidebar";
  chats: ChatRow[];
  currentChat: ChatRow | null;
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  hasTranscription: boolean;
  showTranscriptionPane: boolean;
  onToggleLayout: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  folders: Folder[];
  transcriptions: TranscriptionListItem[];
  onSend: (text: string) => void;
  onMentionClick: (id: string, kind: MentionKind) => void;
  onAttachAudio: () => void;
  composerFocusTick?: number;
};

export function ChatPane({
  variant,
  chats,
  currentChat,
  messages,
  status,
  hasTranscription,
  showTranscriptionPane,
  onToggleLayout,
  onNewChat,
  onSelectChat,
  folders,
  transcriptions,
  onSend,
  onMentionClick,
  onAttachAudio,
  composerFocusTick,
}: ChatPaneProps) {
  const composerInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const placeholder = messages.length > 0
      ? "Sigue esta conversación"
      : "Pregunta sobre cualquier transcripción";

  const submit = (text: string) => {
    const next = text.trim();
    if (!next || busy) return;
    onSend(next);
    setInput("");
  };

  return (
    <section
      className={`flex h-full min-w-0 flex-col bg-white ${
        variant === "sidebar" ? "w-[400px] shrink-0 border-l border-[#14141414]" : "grow"
      }`}
    >
      <ChatHeader
        variant={variant}
        chats={chats}
        currentChat={currentChat}
        hasTranscription={hasTranscription}
        showTranscriptionPane={showTranscriptionPane}
        onToggleLayout={onToggleLayout}
        onNewChat={onNewChat}
        onSelectChat={onSelectChat}
        composerInputRef={composerInputRef}
      />
      {messages.length === 0 ? (
        <EmptyConversation onPick={submit} compact={variant === "sidebar"} />
      ) : (
        <MessageList
          messages={messages}
          compact={variant === "sidebar"}
          streaming={status === "streaming"}
          onMentionClick={onMentionClick}
        />
      )}
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => submit(input)}
        placeholder={placeholder}
        disabled={busy}
        wide={variant === "full"}
        folders={folders}
        transcriptions={transcriptions}
        onMentionClick={onMentionClick}
        onAttachAudio={onAttachAudio}
        focusTick={composerFocusTick}
        inputRef={composerInputRef}
      />
    </section>
  );
}
