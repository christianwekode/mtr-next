"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTitle } from "@/lib/format";
import type { Folder, TranscriptionListItem } from "@/lib/types";

const UNFILED = "__unfiled__";

export type EditTranscriptionDialogProps = {
  item: TranscriptionListItem | null;
  folders: Folder[];
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: { short_title: string; folder_id: string | null }) => Promise<void>;
};

export function EditTranscriptionDialog({ item, folders, onOpenChange, onSave }: EditTranscriptionDialogProps) {
  const nameId = useId();
  const folderId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [folderValue, setFolderValue] = useState(UNFILED);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();
  const folderItems = [
    { value: UNFILED, label: "Sin carpeta" },
    ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
  ];

  useEffect(() => {
    if (!item) return;
    setName(listTitle(item));
    setFolderValue(item.folder_id ?? UNFILED);
    setBusy(false);
    setError(null);
  }, [item]);

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false} initialFocus={inputRef}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!item || !trimmed || busy) return;
            setBusy(true);
            setError(null);
            void onSave(item.id, {
              short_title: trimmed,
              folder_id: folderValue === UNFILED ? null : folderValue,
            })
              .then(() => {
                onOpenChange(false);
              })
              .catch((cause: unknown) => {
                setBusy(false);
                setError(cause instanceof Error ? cause.message : "No se pudo actualizar la transcripción");
              });
          }}
        >
          <DialogHeader>
            <DialogTitle>Modificar detalles</DialogTitle>
            <DialogDescription>Cambia el nombre y la carpeta de la transcripción.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor={nameId}>Nombre</Label>
              <Input
                ref={inputRef}
                id={nameId}
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre de la transcripción"
                disabled={busy}
                aria-invalid={Boolean(error)}
              />
            </Field>
            <Field>
              <Label htmlFor={folderId}>Carpeta</Label>
              <Select
                items={folderItems}
                value={folderValue}
                onValueChange={(value) => {
                  if (typeof value === "string") setFolderValue(value);
                }}
                disabled={busy}
              >
                <SelectTrigger id={folderId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start" className="z-60 min-w-(--anchor-width)">
                  <SelectItem value={UNFILED}>Sin carpeta</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={busy} />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={busy || !trimmed}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
