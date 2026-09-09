"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  BubbleChatIcon,
  LayoutTwoColumnIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/components/composer";
import { Icon } from "@/components/icon";
import { chatDayLabel, chatDisplayTitle, formatChatAge } from "@/lib/format";
import { uiMessageText } from "@/lib/message";
import type { ChatRow } from "@/lib/types";

const SUGGESTIONS = [
  {
    prompt: "¿Qué acuerdos se tomaron esta semana en Comercial?",
    label: "Acuerdos comerciales",
  },
  {
    prompt: "Resume las objeciones que salieron en exploración de mercados",
    label: "Objeciones de mercado",
  },
  {
    prompt: "¿Qué hay pendiente de inventario y daily de planta?",
    label: "Inventario de planta",
  },
] as const;

type ChatPaneProps = {
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
  onSend: (text: string) => void;
  onAttachAudio: () => void;
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
  onSend,
  onAttachAudio,
}: ChatPaneProps) {
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const placeholder = hasTranscription
    ? "Pregunta sobre esta transcripción"
    : messages.length > 0
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
      />
      {messages.length === 0 ? (
        <EmptyConversation onPick={submit} compact={variant === "sidebar"} />
      ) : (
        <MessageList messages={messages} compact={variant === "sidebar"} />
      )}
      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => submit(input)}
        placeholder={placeholder}
        disabled={busy}
        wide={variant === "full"}
        onAttachAudio={onAttachAudio}
      />
    </section>
  );
}

function ChatHeader({
  variant,
  chats,
  currentChat,
  hasTranscription,
  showTranscriptionPane,
  onToggleLayout,
  onNewChat,
  onSelectChat,
}: {
  variant: "full" | "sidebar";
  chats: ChatRow[];
  currentChat: ChatRow | null;
  hasTranscription: boolean;
  showTranscriptionPane: boolean;
  onToggleLayout: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const label = chatDisplayTitle(currentChat?.title ?? null);
  const grouped = groupChats(chats);

  return (
    <div className="relative flex h-10 w-full shrink-0 items-center justify-between px-4" ref={rootRef}>
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`flex h-7 min-w-0 items-center gap-2 rounded-full px-2 ${open ? "bg-[#1414140F]" : ""}`}
        >
          <span className="min-w-0 truncate text-[13px]/[18px] text-[#141414]">{label}</span>
          <Icon icon={ArrowDown01Icon} size={10} color="#14141485" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleLayout}
        className={`flex items-center text-[#141414A8] ${hasTranscription ? "" : "opacity-40"}`}
        disabled={!hasTranscription}
        aria-pressed={showTranscriptionPane}
        aria-label="Alternar panel de transcripción"
      >
        <Icon icon={LayoutTwoColumnIcon} size={16} />
      </button>
      {open ? (
        <div
          className={`absolute left-4 top-10 z-20 flex flex-col rounded-xl border border-[#14141414] bg-white p-1.5 ${
            variant === "sidebar" ? "right-4" : "w-[320px]"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onNewChat();
            }}
            className="flex h-8 w-full shrink-0 items-center gap-2 rounded-lg bg-[#1414140F] px-2.5"
          >
            <Icon icon={Add01Icon} size={16} />
            <span className="text-[13px]/[18px] text-[#141414]">Nuevo chat</span>
          </button>
          <div className="h-px w-full shrink-0 bg-[#14141414]" />
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="flex h-7 w-full shrink-0 items-center px-2.5 pb-1 pt-2">
                <span className="text-xs leading-4 text-[#14141499]">{group.label}</span>
              </div>
              {group.items.map((chat) => {
                const selected = chat.id === currentChat?.id;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelectChat(chat.id);
                    }}
                    className={`flex h-8 w-full shrink-0 items-center gap-2 rounded-lg px-2.5 ${
                      selected ? "bg-[#1414140A]" : ""
                    }`}
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center">
                      <Icon icon={BubbleChatIcon} size={14} color="#141414A8" className="opacity-60" />
                    </span>
                    <span className="min-w-0 grow truncate text-left text-[13px]/[18px] text-[#141414]">
                      {chatDisplayTitle(chat.title)}
                    </span>
                    <span className="w-max min-w-6 shrink-0 text-right text-xs leading-4 text-[#141414BD]">
                      {formatChatAge(chat.updated_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function groupChats(chats: ChatRow[]): Array<{ label: string; items: ChatRow[] }> {
  const groups: Array<{ label: string; items: ChatRow[] }> = [];
  for (const chat of chats) {
    if (!chat.title?.trim()) continue;
    const label = chatDayLabel(chat.updated_at);
    const last = groups.at(-1);
    if (last?.label === label) {
      last.items.push(chat);
    } else {
      groups.push({ label, items: [chat] });
    }
  }
  return groups;
}

function EmptyConversation({ onPick, compact }: { onPick: (text: string) => void; compact: boolean }) {
  if (compact) {
    return <div className="min-h-0 grow" />;
  }

  return (
    <div className="flex min-h-0 w-full grow flex-col items-center justify-center px-6 py-12">
      <div className="flex w-[640px] max-w-full flex-col items-center gap-2">
        <h2 className="text-center font-sans text-xl/7 text-[#141414]">Pregunta sobre tus reuniones</h2>
        <p className="text-center text-[13px]/5 text-[#141414BD]">
          Las grabaciones presenciales se transcriben y quedan en el árbol. Pregunta sobre cualquier carpeta o
          reunión.
        </p>
      </div>
      <div className="flex w-[640px] max-w-full flex-col pt-8">
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-[#FCFCFC] shadow-[0_0_0_1px_#1414140A]">
          {SUGGESTIONS.map((item, index) => (
            <div key={item.label}>
              {index > 0 ? (
                <div className="flex h-px w-full shrink-0 px-4">
                  <div className="h-px grow bg-[#1414140A]" />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onPick(item.prompt)}
                className="flex w-full items-center gap-5 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 grow items-start gap-2.5">
                  <div
                    className="size-8 shrink-0 overflow-hidden rounded-md"
                    style={{ background: "linear-gradient(180deg, #d7eef8 0%, #7ec8e3 100%)" }}
                  />
                  <div className="flex min-w-0 grow flex-col gap-0.5">
                    <span className="text-[13px]/5 text-[#141414]">{item.prompt}</span>
                    <span className="text-[13px]/[18px] text-[#141414BD]">{item.label}</span>
                  </div>
                </div>
                <Icon icon={ArrowRight01Icon} size={14} color="#14141447" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageList({ messages, compact }: { messages: UIMessage[]; compact: boolean }) {
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
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} compact={compact} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatMessage({ message, compact }: { message: UIMessage; compact: boolean }) {
  const text = uiMessageText(message);
  const width = compact ? "w-full" : "w-[640px] max-w-full";

  if (message.role === "user") {
    return (
      <div className={`flex ${width}`}>
        <div className="w-fit max-w-full rounded-2xl border border-[#14141414] bg-[#F5F5F5] px-3.5 py-2.5">
          <p className="text-[13px]/[18px] text-[#141414]">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${width}`}>
      <AssistantBody text={text} />
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function AssistantBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) {
    return <p className="text-[13px]/5 text-[#141414BD]">…</p>;
  }

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((line) => /^[-*•]\s+/.test(line));
        const isTitle = index === 0 && lines.length === 1 && lines[0].length < 80 && !lines[0].endsWith(".");

        if (isTitle) {
          return (
            <p key={index} className="text-[13px]/5 font-semibold text-[#141414]">
              {renderInline(lines[0])}
            </p>
          );
        }

        if (isList) {
          return (
            <ul key={index} className="flex w-full flex-col gap-2">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-4 shrink-0 items-center justify-center">
                    <span className="size-1.25 rounded-full bg-[#141414]" />
                  </span>
                  <span className="text-[13px]/5 text-[#141414]">
                    {renderInline(line.replace(/^[-*•]\s*/, ""))}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-[13px]/5 text-[#141414]">
            {renderInline(block)}
          </p>
        );
      })}
    </>
  );
}
