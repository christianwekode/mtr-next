"use client";

import { Add01Icon, ArrowDown01Icon, BubbleChatIcon, LayoutTwoColumnIcon } from "@hugeicons/core-free-icons";
import { useEffect, useState, type RefObject } from "react";
import { Icon } from "@/components/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  composerInputRef?: RefObject<HTMLInputElement | null>;
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
  composerInputRef,
}: ChatHeaderProps) {
  const [open, setOpen] = useState(false);

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
    <div className="relative flex h-10 w-full shrink-0 items-center justify-between px-4">
      <div className="flex min-w-0 items-center gap-1">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            className={`flex h-7 min-w-0 cursor-pointer items-center gap-2 rounded-full px-2 outline-none ${
              open ? "bg-[#1414140F]" : ""
            }`}
          >
            <span className="min-w-0 truncate text-[13px]/[18px] text-[#141414]">{label}</span>
            <Icon icon={ArrowDown01Icon} size={10} color="#14141485" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={4}
            finalFocus={composerInputRef}
            className={`max-h-[25rem] rounded-xl border border-[#14141414] bg-white p-1.5 text-[#141414] shadow-[0px_8px_16px_#1414141F] ${
              variant === "sidebar" ? "w-[368px] min-w-[368px]" : "w-[320px] min-w-[320px]"
            }`}
          >
            <DropdownMenuItem
              onClick={onNewChat}
              className="h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-[13px]/[18px] focus:bg-[#1414140A]"
            >
              <Icon icon={Add01Icon} size={16} />
              <span>Nuevo chat</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-0 my-0 h-px bg-[#14141414]" />
            {grouped.map((group) => (
              <DropdownMenuGroup key={group.label}>
                <DropdownMenuLabel className="flex h-7 items-center px-2.5 pb-1 pt-2 text-xs font-normal leading-4 text-[#14141499]">
                  {group.label}
                </DropdownMenuLabel>
                {group.items.map((chat) => {
                  const selected = chat.id === currentChat?.id;
                  return (
                    <DropdownMenuItem
                      key={chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      className={`h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-[13px]/[18px] focus:bg-[#1414140A] ${
                        selected ? "bg-[#1414140A]" : ""
                      }`}
                    >
                      <span className="flex size-3.5 shrink-0 items-center justify-center">
                        <Icon icon={BubbleChatIcon} size={14} color="#141414A8" className="opacity-60" />
                      </span>
                      <span className="min-w-0 grow truncate text-left">{chatDisplayTitle(chat.title)}</span>
                      <span className="w-max min-w-6 shrink-0 text-right text-xs leading-4 text-[#141414BD]">
                        {formatChatAge(chat.updated_at)}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
