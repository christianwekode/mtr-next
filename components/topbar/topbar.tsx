"use client";

import { AiMagicIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { SearchCommand } from "@/components/topbar/search-command";
import type { TranscriptionListItem } from "@/lib/types";

export type TopbarProps = {
  transcriptions: TranscriptionListItem[];
  onSelectTranscription: (id: string) => void;
  onNewChat: () => void;
};

export function Topbar({ transcriptions, onSelectTranscription, onNewChat }: TopbarProps) {
  return (
    <header className="flex h-[52px] w-full shrink-0 items-center border-b border-[#14141414] bg-white px-4">
      <div className="flex min-w-0 grow items-center gap-3">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[#141414]">
          <div className="size-2 rounded-[2px] border-[1.5px] border-[#FCFCFC]" />
        </div>
        <div className="flex h-8 items-center gap-2 rounded-lg bg-[#1414140F] py-0 pl-2.5 pr-3">
          <Icon icon={AiMagicIcon} size={16} />
          <span className="text-[13px]/[18px] text-[#141414]">Transcripciones</span>
        </div>
      </div>
      <SearchCommand
        transcriptions={transcriptions}
        onSelect={onSelectTranscription}
        onNewChat={onNewChat}
      />
      <div className="flex min-w-0 grow items-center justify-end">
        <div
          className="size-7 shrink-0 overflow-hidden rounded-full"
          style={{ background: "linear-gradient(180deg, #d7eef8 0%, #7ec8e3 100%)" }}
          aria-hidden
        />
      </div>
    </header>
  );
}
