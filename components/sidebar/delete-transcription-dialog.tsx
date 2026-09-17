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
import { listTitle } from "@/lib/format";
import type { TranscriptionListItem } from "@/lib/types";

export type DeleteTranscriptionDialogProps = {
  item: TranscriptionListItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
};

export function DeleteTranscriptionDialog({ item, onOpenChange, onConfirm }: DeleteTranscriptionDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AlertDialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (busy) return;
        if (!open) setError(null);
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar transcripción</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará «{item ? listTitle(item) : ""}». Esta acción no se puede deshacer.
          </AlertDialogDescription>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={busy || !item}
            onClick={(event) => {
              event.preventDefault();
              if (!item || busy) return;
              setBusy(true);
              setError(null);
              void onConfirm(item.id)
                .then(() => {
                  setBusy(false);
                  onOpenChange(false);
                })
                .catch((cause: unknown) => {
                  setBusy(false);
                  setError(cause instanceof Error ? cause.message : "No se pudo eliminar la transcripción");
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
