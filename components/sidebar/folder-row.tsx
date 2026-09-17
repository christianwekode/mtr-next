"use client";

import { EllipsisIcon, Folder01Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { TranscriptionRow } from "@/components/sidebar/transcription-row";
import {
  itemMenuContentClassName,
  itemMenuItemClassName,
  itemMenuTriggerClassName,
} from "@/components/sidebar/item-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Folder, TranscriptionListItem } from "@/lib/types";

export type FolderRowProps = {
  folder: Folder;
  items: TranscriptionListItem[];
  expanded: boolean;
  selectedId: string | null;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEditTranscription: (item: TranscriptionListItem) => void;
  onDeleteTranscription: (item: TranscriptionListItem) => void;
};

export function FolderRow({
  folder,
  items,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onEditTranscription,
  onDeleteTranscription,
}: FolderRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <div className="group flex h-8 w-full items-center rounded-lg hover:bg-[#1414140A]">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-h-0 min-w-0 grow items-center gap-2 overflow-hidden rounded-lg p-2 text-left"
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <Icon icon={expanded ? Folder02Icon : Folder01Icon} size={16} />
          </span>
          <span className="min-w-0 truncate text-[13px]/[18px] text-[#141414]">{folder.name}</span>
        </button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            aria-label={`Acciones de ${folder.name}`}
            className={`${itemMenuTriggerClassName} ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            <Icon icon={EllipsisIcon} size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" sideOffset={4} className={itemMenuContentClassName}>
            <DropdownMenuItem className={itemMenuItemClassName} onClick={onEdit}>
              Modificar detalles
            </DropdownMenuItem>
            <DropdownMenuItem className={itemMenuItemClassName} onClick={onDuplicate}>
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-3.5 my-1.5 bg-[#14141414]" />
            <DropdownMenuItem
              variant="destructive"
              className={`${itemMenuItemClassName} text-[#BE1744] focus:text-[#BE1744]`}
              onClick={onDelete}
            >
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded ? (
        <div
          className="mx-3.5 flex flex-col gap-1 border-l border-[#E5E5E5] px-2.5 py-0.5"
          style={{ translate: "1px" }}
        >
          {items.map((item) => (
            <TranscriptionRow
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onSelect={onSelect}
              onEdit={() => onEditTranscription(item)}
              onDelete={() => onDeleteTranscription(item)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
