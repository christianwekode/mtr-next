"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Folder } from "@/lib/types";

export type DeleteFolderDialogProps = {
  folder: Folder | null;
  transcriptionCount: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
};

export function DeleteFolderDialog({
  folder,
  transcriptionCount,
  onOpenChange,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog
      open={Boolean(folder)}
      onOpenChange={(open) => {
        if (busy) return;
        if (!open) setError(null);
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar carpeta</AlertDialogTitle>
          <AlertDialogDescription>
            {transcriptionCount > 0
              ? `Se eliminará «${folder?.name ?? ""}». Las transcripciones de esta carpeta aparecerán en la sección «Sin asignar.`
              : `Se eliminará «${folder?.name ?? ""}». Esta acción no se puede deshacer.`}
          </AlertDialogDescription>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={busy || !folder}
            onClick={(event) => {
              event.preventDefault();
              if (!folder || busy) return;
              setBusy(true);
              setError(null);
              void onConfirm(folder.id)
                .then(() => {
                  setBusy(false);
                  onOpenChange(false);
                })
                .catch((cause: unknown) => {
                  setBusy(false);
                  setError(cause instanceof Error ? cause.message : "No se pudo eliminar la carpeta");
                });
            }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
