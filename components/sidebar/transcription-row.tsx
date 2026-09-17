"use client";

import { EllipsisIcon, File02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/icon";
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
import { listTitle } from "@/lib/format";
import type { TranscriptionListItem } from "@/lib/types";

export type TranscriptionRowProps = {
  item: TranscriptionListItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TranscriptionRow({ item, selected, onSelect, onEdit, onDelete }: TranscriptionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`group flex h-8 w-full shrink-0 items-center rounded-lg ${
        selected ? "bg-[#1414140F]" : "hover:bg-[#1414140A]"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className="flex min-h-0 min-w-0 grow items-center gap-2 overflow-hidden rounded-lg p-2 text-left"
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          {item.status === "processing" ? (
            <Icon icon={Loading03Icon} size={16} className="animate-spin" color="#6bd668" />
          ) : (
            <Icon icon={File02Icon} size={16} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px]/[18px] text-[#141414]">{listTitle(item)}</span>
      </button>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          aria-label={`Acciones de ${listTitle(item)}`}
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
  );
}
