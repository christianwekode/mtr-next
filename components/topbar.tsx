"use client";

import { AiMagicIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";

type TopbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function Topbar({ query, onQueryChange }: TopbarProps) {
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
      <label className="flex h-8 w-[360px] shrink-0 items-center gap-2 rounded-full border border-[#14141414] px-3">
        <Icon icon={Search01Icon} size={16} color="#141414A8" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar transcripciones"
          className="min-w-0 grow bg-transparent text-[13px]/[18px] text-[#141414] outline-none placeholder:text-[#1414145C]"
        />
      </label>
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
