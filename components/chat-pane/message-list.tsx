"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat-pane/chat-message";
import type { MentionKind } from "@/lib/mentions";

export type MessageListProps = {
  messages: UIMessage[];
  compact: boolean;
  streaming: boolean;
  onMentionClick: (id: string, kind: MentionKind) => void;
};

export function MessageList({ messages, compact, streaming, onMentionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div
      className={`flex min-h-0 grow flex-col overflow-y-auto ${
        compact ? "gap-6 p-4" : "items-center gap-6 px-6 pb-4 pt-6"
      }`}
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          message={message}
          compact={compact}
          streaming={streaming && index === messages.length - 1}
          onMentionClick={onMentionClick}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
