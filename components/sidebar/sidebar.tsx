"use client";

import { Add01Icon, FolderAddIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { DeleteFolderDialog } from "@/components/sidebar/delete-folder-dialog";
import { FolderRow } from "@/components/sidebar/folder-row";
import { TranscriptionRow } from "@/components/sidebar/transcription-row";
import { CreateFolderDialog } from "@/components/topbar/create-folder-dialog";
import { NowPlayingBar } from "@/components/transcription-player/now-playing-bar";
import type { Folder, TranscriptionListItem } from "@/lib/types";

export type SidebarProps = {
  folders: Folder[];
  transcriptions: TranscriptionListItem[];
  selectedId: string | null;
  expandedFolderIds: Set<string>;
  onToggleFolder: (id: string) => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => Promise<void>;
  onDuplicateFolder: (folder: Folder) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
};

export function Sidebar({
  folders,
  transcriptions,
  selectedId,
  expandedFolderIds,
  onToggleFolder,
  onSelect,
  onNewChat,
  onCreateFolder,
  onRenameFolder,
  onDuplicateFolder,
  onDeleteFolder,
}: SidebarProps) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const visible = transcriptions.filter((item) => item.status !== "failed");
  const unfiled = visible.filter((item) => item.folder_id == null);
  const deletingCount = deletingFolder
    ? visible.filter((item) => item.folder_id === deletingFolder.id).length
    : 0;

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-[#14141414] bg-white">
      <div className="flex min-h-0 grow flex-col overflow-y-auto p-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left"
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <Icon icon={Add01Icon} size={16} />
          </span>
          <span className="text-[13px]/[18px] text-[#141414]">Nuevo chat</span>
        </button>
        <button
          type="button"
          onClick={() => setFolderOpen(true)}
          className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left"
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <Icon icon={FolderAddIcon} size={16} />
          </span>
          <span className="text-[13px]/[18px] text-[#141414]">Nueva carpeta</span>
        </button>
        <div className="flex h-8 w-full shrink-0 items-center p-2">
          <span className="text-xs leading-4 text-[#14141499]">Conocimiento</span>
        </div>
        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            items={visible.filter((item) => item.folder_id === folder.id)}
            expanded={expandedFolderIds.has(folder.id)}
            selectedId={selectedId}
            onToggle={() => onToggleFolder(folder.id)}
            onSelect={onSelect}
            onEdit={() => setEditingFolder(folder)}
            onDuplicate={() => {
              void onDuplicateFolder(folder);
            }}
            onDelete={() => setDeletingFolder(folder)}
          />
        ))}
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
      <NowPlayingBar />
      <CreateFolderDialog open={folderOpen} onOpenChange={setFolderOpen} onCreate={onCreateFolder} />
      <CreateFolderDialog
        mode="edit"
        open={Boolean(editingFolder)}
        initialName={editingFolder?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setEditingFolder(null);
        }}
        onCreate={async (name) => {
          if (!editingFolder) return;
          await onRenameFolder(editingFolder.id, name);
        }}
      />
      <DeleteFolderDialog
        folder={deletingFolder}
        transcriptionCount={deletingCount}
        onOpenChange={(open) => {
          if (!open) setDeletingFolder(null);
        }}
        onConfirm={onDeleteFolder}
      />
    </aside>
  );
}
