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

export type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
};

export function CreateFolderDialog({ open, onOpenChange, onCreate }: CreateFolderDialogProps) {
  const nameId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  useEffect(() => {
    if (!open) return;
    setName("");
    setBusy(false);
    setError(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false} initialFocus={inputRef}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!trimmed || busy) return;
            setBusy(true);
            setError(null);
            void onCreate(trimmed)
              .then(() => {
                onOpenChange(false);
              })
              .catch((cause: unknown) => {
                setBusy(false);
                setError(cause instanceof Error ? cause.message : "No se pudo crear la carpeta");
              });
          }}
        >
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
            <DialogDescription>Introduce un nombre para crear la carpeta.</DialogDescription>
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
                placeholder="Nombre de la carpeta"
                disabled={busy}
                aria-invalid={Boolean(error)}
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={busy} />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={busy || !trimmed}>
              Crear carpeta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
