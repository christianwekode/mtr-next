"use client";

import {
  AlertCircleIcon,
  ArrowRight01Icon,
  File02Icon,
  Folder02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { listTitle } from "@/lib/format";
import type { Folder, TranscriptionListItem } from "@/lib/types";

type SidebarProps = {
  folders: Folder[];
  transcriptions: TranscriptionListItem[];
  query: string;
  selectedId: string | null;
  expandedFolderIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onSelect: (id: string) => void;
};

export function Sidebar({
  folders,
  transcriptions,
  query,
  selectedId,
  expandedFolderIds,
  onToggleFolder,
  onSelect,
}: SidebarProps) {
  const needle = query.trim().toLowerCase();
  const matches = (item: TranscriptionListItem) =>
    !needle || listTitle(item).toLowerCase().includes(needle);

  const unfiled = transcriptions.filter((item) => item.folder_id == null && matches(item));

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#14141414] bg-white">
      <div className="flex min-h-0 grow flex-col overflow-y-auto p-2">
        <div className="flex h-8 w-full shrink-0 items-center p-2">
          <span className="text-xs leading-4 text-[#14141499]">Transcripciones</span>
        </div>
        {folders.map((folder) => {
          const items = transcriptions.filter((item) => item.folder_id === folder.id && matches(item));
          const expanded = expandedFolderIds.has(folder.id);
          return (
            <div key={folder.id}>
              <button
                type="button"
                onClick={() => onToggleFolder(folder.id)}
                className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left"
              >
                <span className={`flex size-4 shrink-0 items-center justify-center ${expanded ? "rotate-90" : ""}`}>
                  <Icon icon={ArrowRight01Icon} size={16} />
                </span>
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <Icon icon={Folder02Icon} size={16} />
                </span>
                <span className="text-[13px]/[18px] text-[#141414]">{folder.name}</span>
              </button>
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
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {unfiled.length > 0 ? (
          <div className="mt-1">
            <div className="flex h-8 items-center px-2 text-xs text-[#14141499]">Sin carpeta</div>
            {unfiled.map((item) => (
              <TranscriptionRow
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function TranscriptionRow({
  item,
  selected,
  onSelect,
}: {
  item: TranscriptionListItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`flex h-8 w-full shrink-0 items-center gap-2 overflow-hidden rounded-lg p-2 text-left ${
        selected ? "bg-[#1414140F]" : ""
      }`}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {item.status === "processing" ? (
          <Icon icon={Loading03Icon} size={16} className="animate-spin" color="#6bd668" />
        ) : item.status === "failed" ? (
          <Icon icon={AlertCircleIcon} size={16} color="#141414A8" />
        ) : (
          <Icon icon={File02Icon} size={16} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px]/[18px] text-[#141414]">
        {listTitle(item)}
      </span>
    </button>
  );
}
