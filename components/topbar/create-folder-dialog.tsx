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
  mode?: "create" | "edit";
  initialName?: string;
};

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreate,
  mode = "create",
  initialName = "",
}: CreateFolderDialogProps) {
  const nameId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setBusy(false);
    setError(null);
  }, [initialName, open]);

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
                setError(cause instanceof Error ? cause.message : isEdit ? "No se pudo actualizar la carpeta" : "No se pudo crear la carpeta");
              });
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? "Modificar detalles" : "Nueva carpeta"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Cambia el nombre de la carpeta." : "Introduce un nombre para crear la carpeta."}
            </DialogDescription>
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
              {isEdit ? "Guardar" : "Crear carpeta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
