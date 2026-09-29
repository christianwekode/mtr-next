"use client";

import { ChevronsUpDownIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatPlaybackClock } from "@/lib/format";
import { avatarUrl, interventionsLabel } from "@/lib/transcript-speakers";
import type { ElevenLabsSpeaker } from "@/lib/types";

export type SpeakerLine = {
  start: number;
  text: string;
};

export type AssignSpeakerDialogProps = {
  open: boolean;
  label: string;
  people: ElevenLabsSpeaker[];
  lines: SpeakerLine[];
  speakingSeconds: number;
  initialPerson: ElevenLabsSpeaker | null;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onAssign: (person: ElevenLabsSpeaker) => void;
};

export function AssignSpeakerDialog({
  open,
  label,
  people,
  lines,
  speakingSeconds,
  initialPerson,
  saving,
  error,
  onOpenChange,
  onAssign,
}: AssignSpeakerDialogProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<ElevenLabsSpeaker | null>(initialPerson);
  const initialId = initialPerson?.id ?? null;
  const initialName = initialPerson?.name ?? null;

  useEffect(() => {
    if (!open) return;
    setSelected(initialId && initialName ? { id: initialId, name: initialName } : null);
    setQuery("");
    setMenuOpen(false);
  }, [open, initialId, initialName]);

  useEffect(() => {
    if (menuOpen) inputRef.current?.focus();
  }, [menuOpen]);

  const normalized = query.trim().toLocaleLowerCase("es");
  const filtered = normalized
    ? people.filter((person) => person.name.toLocaleLowerCase("es").includes(normalized))
    : people;
  const exactMatch = people.some((person) => person.name.toLocaleLowerCase("es") === normalized);
  const canCreate = normalized.length > 0 && !exactMatch;

  function choose(person: ElevenLabsSpeaker) {
    setSelected(person);
    setQuery("");
    setMenuOpen(false);
  }

  function createFromQuery() {
    const name = query.trim();
    if (!name) return;
    const existing = people.find((person) => person.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"));
    choose(existing ?? { id: crypto.randomUUID(), name });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (canCreate) {
      createFromQuery();
      return;
    }
    const match = filtered[0];
    if (match) choose(match);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[400px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-visible rounded-xl border border-[#14141414] bg-white p-0 text-[#141414] shadow-[0_16px_40px_-12px_#14141433,0_2px_6px_#1414140A] ring-0 sm:max-w-[400px]"
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="font-sans text-sm/5 font-semibold text-[#141414]">¿Quién es {label}?</DialogTitle>
            <DialogDescription className="font-sans text-xs/4 text-[#141414A8]">
              Se aplicará a todas sus intervenciones en esta grabación
            </DialogDescription>
          </div>
          <DialogClose className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#141414A8] outline-none hover:bg-[#1414140F]">
            <XIcon className="size-3.5" />
            <span className="sr-only">Cerrar</span>
          </DialogClose>
        </div>

        <div className="flex flex-col gap-1.5 px-4">
          <label htmlFor={inputId} className="font-sans text-xs/4 font-medium text-[#141414BD]">
            Persona
          </label>
          <div className={menuOpen ? "relative z-20" : "relative"}>
            <div
              className={`flex h-9 items-center gap-2 rounded-lg border bg-white pr-2.5 pl-2 ${
                menuOpen ? "border-[#141414] shadow-[0_0_0_3px_#1414140F]" : "border-[#14141429]"
              }`}
            >
              {menuOpen ? (
                <>
                  <SearchIcon className="size-4 shrink-0 text-[#1414147A]" />
                  <input
                    id={inputId}
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    onBlur={() => setMenuOpen(false)}
                    placeholder="Buscar persona"
                    className="min-w-0 grow bg-transparent font-sans text-[13px]/5 text-[#141414] outline-none placeholder:text-[#1414145C]"
                  />
                </>
              ) : (
                <button
                  id={inputId}
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex min-w-0 grow cursor-pointer items-center gap-2 text-left outline-none"
                >
                  {selected ? (
                    <>
                      <img
                        src={avatarUrl(selected.id)}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0 rounded-full"
                      />
                      <span className="min-w-0 grow truncate font-sans text-[13px]/5 text-[#141414]">{selected.name}</span>
                    </>
                  ) : (
                    <span className="min-w-0 grow font-sans text-[13px]/5 text-[#1414145C]">Buscar persona</span>
                  )}
                </button>
              )}
              <button
                type="button"
                aria-label={menuOpen ? "Cerrar personas" : "Abrir personas"}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setMenuOpen((current) => !current)}
                className="flex shrink-0 cursor-pointer items-center text-[#1414147A]"
              >
                <ChevronsUpDownIcon className="size-3.5" />
              </button>
            </div>

            {menuOpen ? (
              <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-10 flex flex-col rounded-[10px] border border-[#14141414] bg-white p-1.5 shadow-[0_12px_32px_-8px_#14141433,0_2px_6px_#1414140A]">
                {filtered.map((person, index) => (
                  <button
                    key={person.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(person)}
                    className={`flex h-9 w-full cursor-pointer items-center gap-2 rounded-md pr-2.5 pl-2 text-left hover:bg-[#1414140A] ${
                      index === 0 ? "bg-[#1414140A]" : ""
                    }`}
                  >
                    <img
                      src={avatarUrl(person.id)}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full"
                    />
                    <span className="min-w-0 grow truncate font-sans text-[13px]/5 text-[#141414]">{person.name}</span>
                  </button>
                ))}
                {canCreate ? (
                  <div className={filtered.length > 0 ? "mt-1.5 border-t border-[#1414140F] pt-1.5" : ""}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={createFromQuery}
                      className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-md pr-2.5 pl-2 text-left hover:bg-[#1414140A]"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-[#14141452]">
                        <PlusIcon className="size-3 text-[#141414A8]" />
                      </span>
                      <span className="min-w-0 grow truncate font-sans text-[13px]/5 text-[#141414]">
                        Añadir “{query.trim()}” como persona nueva
                      </span>
                      <span className="shrink-0 font-sans text-xs/4 text-[#1414148A]">↵</span>
                    </button>
                  </div>
                ) : null}
                {filtered.length === 0 && !canCreate ? (
                  <p className="px-2 py-2 font-sans text-[13px]/5 text-[#1414148A]">
                    Escribe un nombre para crear la persona.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-xs/4 font-medium text-[#141414BD]">Lo que ha dicho en esta grabación</p>
            <p className="shrink-0 font-sans text-xs/4 text-[#1414148A]">
              {interventionsLabel(lines.length, speakingSeconds)}
            </p>
          </div>
          <div className="relative h-54 overflow-hidden rounded-lg border border-[#14141414] bg-[#FAFAFA]">
            <div className="h-full overflow-y-auto py-0.5 pr-3.5">
              {lines.length === 0 ? (
                <p className="px-3 py-2 font-sans text-[13px]/5 text-[#1414148A]">No hay intervenciones de esta persona.</p>
              ) : (
                lines.map((line, index) => (
                  <div
                    key={`${line.start}-${index}`}
                    className={`flex items-start gap-1 py-2 pl-3 ${index > 0 ? "border-t border-[#1414140F]" : ""}`}
                  >
                    <span className="w-11 shrink-0 font-sans text-xs/5 text-[#1414148A]">
                      {formatPlaybackClock(line.start, line.start)}
                    </span>
                    <p className="min-w-0 grow font-sans text-[13px]/5 text-[#141414]">{line.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-transparent to-[#FAFAFA]" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4">
          {error ? <p className="mr-auto font-sans text-xs/4 text-[#141414A8]">{error}</p> : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 cursor-pointer items-center rounded-lg border border-[#14141414] px-3 font-sans text-[13px]/[18px] font-medium text-[#141414]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selected || saving}
            onClick={() => {
              if (selected) onAssign(selected);
            }}
            className="flex h-8 cursor-pointer items-center rounded-lg bg-[#141414] px-3.5 font-sans text-[13px]/[18px] font-medium text-[#FCFCFC] disabled:cursor-not-allowed disabled:bg-[#14141429]"
          >
            {selected ? `Asignar a ${selected.name}` : "Asignar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
