"use client";

import { Add01Icon, ArrowDown01Icon, BubbleChatIcon, LayoutTwoColumnIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { chatDayLabel, chatDisplayTitle, formatChatAge } from "@/lib/format";
import type { ChatRow } from "@/lib/types";

export type ChatHeaderProps = {
  variant: "full" | "sidebar";
  chats: ChatRow[];
  currentChat: ChatRow | null;
  hasTranscription: boolean;
  showTranscriptionPane: boolean;
  onToggleLayout: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
};

export function ChatHeader({
  variant,
  chats,
  currentChat,
  hasTranscription,
  showTranscriptionPane,
  onToggleLayout,
  onNewChat,
  onSelectChat,
}: ChatHeaderProps) {
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key.toLowerCase() !== "c" || !event.shiftKey) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
        onClick={() => {
          if (!hasTranscription) return;
          onToggleLayout();
        }}
        className={`flex size-6 cursor-pointer items-center justify-center rounded-md text-[#141414A8] outline-none hover:bg-[#1414140F] ${hasTranscription ? "" : "pointer-events-none opacity-40"}`}
        aria-disabled={!hasTranscription}
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
