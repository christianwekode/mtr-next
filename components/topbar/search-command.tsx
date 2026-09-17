"use client";

import { Add01Icon, File02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { listTitle } from "@/lib/format";
import { normalizeSearch } from "@/lib/mentions";
import type { TranscriptionListItem } from "@/lib/types";

export type SearchCommandProps = {
  transcriptions: TranscriptionListItem[];
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

function transcriptionFilter(_value: string, search: string, keywords: string[] = []) {
  const needle = normalizeSearch(search);
  if (!needle) return 1;
  return normalizeSearch(keywords.join("")).includes(needle) ? 1 : 0;
}

export function SearchCommand({ transcriptions, onSelect, onNewChat }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const items = transcriptions.filter((item) => item.status !== "failed");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-[360px] shrink-0 items-center gap-2 rounded-full border border-[#14141414] px-3 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Buscar transcripciones"
      >
        <Icon icon={Search01Icon} size={16} color="#141414A8" />
        <span className="min-w-0 grow truncate text-[13px]/[18px] text-[#1414145C]">
          Buscar transcripciones
        </span>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar transcripciones"
        description="Filtra y abre una transcripción"
        className="sm:max-w-lg"
      >
        <Command key={String(open)} filter={transcriptionFilter}>
          <CommandInput placeholder="Escribe un comando o busca..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup heading="Acciones">
              <CommandItem
                value="nuevo-chat"
                keywords={["Nuevo chat"]}
                onSelect={() => {
                  onNewChat();
                  setOpen(false);
                }}
              >
                <Icon icon={Add01Icon} size={16} />
                <span>Nuevo chat</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Transcripciones">
              {items.map((item) => {
                const title = listTitle(item);
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    keywords={[title]}
                    onSelect={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <Icon icon={File02Icon} size={16} />
                    <span className="min-w-0 truncate">{title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
