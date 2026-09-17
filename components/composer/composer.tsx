"use client";

import { Add01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { MentionOptionItem, type MentionOption } from "@/components/composer/mention-option-item";
import { Icon } from "@/components/icon";
import { MentionBadge } from "@/components/mention-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listTitle } from "@/lib/format";
import {
  findActiveMention,
  normalizeSearch,
  serializeMention,
  serializeParts,
  splitComposerValue,
  type MentionKind,
} from "@/lib/mentions";
import type { Folder, TranscriptionListItem } from "@/lib/types";

export type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  wide?: boolean;
  folders: Folder[];
  transcriptions: TranscriptionListItem[];
  onMentionClick: (id: string, kind: MentionKind) => void;
  onAttachAudio: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  wide,
  folders,
  transcriptions,
  onMentionClick,
  onAttachAudio,
}: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mentionDismissedRef = useRef(false);
  const spaceKeyRef = useRef(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [caret, setCaret] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { prefixParts, inputValue } = splitComposerValue(value);
  const mention = findActiveMention(inputValue, caret);
  const mentionQuery = mention?.query ?? "";
  const mentionStart = mention?.start ?? -1;

  const folderOptions = useMemo(() => {
    const needle = normalizeSearch(mentionQuery);
    return folders
      .filter((folder) => !needle || normalizeSearch(folder.name).includes(needle))
      .map((folder): MentionOption => ({ kind: "folder", id: folder.id, label: folder.name }));
  }, [folders, mentionQuery]);

  const transcriptionOptions = useMemo(() => {
    const needle = normalizeSearch(mentionQuery);
    return transcriptions
      .filter((item) => item.status !== "failed")
      .filter((item) => !needle || normalizeSearch(listTitle(item)).includes(needle))
      .map((item): MentionOption => ({ kind: "transcription", id: item.id, label: listTitle(item) }));
  }, [mentionQuery, transcriptions]);

  const options = useMemo(
    () => [...folderOptions, ...transcriptionOptions],
    [folderOptions, transcriptionOptions],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [mentionQuery, mentionOpen]);

  useEffect(() => {
    if (!mentionOpen) return;
    document
      .querySelector(`[data-mention-option="${highlightIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, mentionOpen]);

  useEffect(() => {
    if (mentionStart < 0) {
      mentionDismissedRef.current = false;
      setMentionOpen(false);
      return;
    }
    if (mentionDismissedRef.current) return;
    setMentionOpen(true);
  }, [disabled, mentionQuery, mentionStart]);

  const selectOption = (option: MentionOption) => {
    if (!mention) return;
    const nextInput = `${inputValue.slice(0, mention.start)}${serializeMention(option.kind, option.id, option.label)} `;
    onChange(serializeParts([...prefixParts, { type: "text", value: nextInput }]));
    mentionDismissedRef.current = false;
    setMentionOpen(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const highlighted = options[highlightIndex] ?? options[0];

  return (
    <form
      className={`flex w-full items-center justify-center ${wide ? "px-6 pb-6" : "px-4 pb-4"}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (mentionOpen) {
          if (highlighted) selectOption(highlighted);
          return;
        }
        if (!value.trim() || disabled) return;
        onSubmit();
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }}
    >
      <DropdownMenu
        open={mentionOpen}
        modal={false}
        onOpenChange={(open, details) => {
          if (open) return;
          if (details.reason === "escape-key") {
            mentionDismissedRef.current = true;
            setMentionOpen(false);
            return;
          }
          details.cancel();
        }}
        onOpenChangeComplete={(open) => {
          if (open) inputRef.current?.focus();
        }}
      >
        <div
          ref={barRef}
          className={`relative flex min-h-11 items-center gap-3 rounded-3xl border border-[#1414141F] bg-white px-3 py-1 ${
            wide ? "w-full max-w-3xl" : "w-full"
          }`}
        >
          <DropdownMenuTrigger
            nativeButton={false}
            render={<span />}
            className="pointer-events-none absolute size-0 overflow-hidden"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            onClick={onAttachAudio}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1414140F] text-[#141414A8]"
            aria-label="Subir audio"
          >
            <Icon icon={Add01Icon} size={14} />
          </button>
          <div
            className="flex min-w-0 grow flex-wrap items-center gap-1"
            onClick={() => inputRef.current?.focus()}
          >
            {prefixParts.map((part, index) =>
              part.type === "mention" ? (
                <MentionBadge
                  key={`${part.kind}-${part.id}-${index}`}
                  id={part.id}
                  kind={part.kind}
                  label={part.label}
                  onMentionClick={onMentionClick}
                  onRemove={() => {
                    onChange(serializeParts(prefixParts.filter((_, partIndex) => partIndex !== index)));
                  }}
                />
              ) : part.value ? (
                <span key={`text-${index}`} className="text-[13px]/[18px] text-[#141414]">
                  {part.value}
                </span>
              ) : null,
            )}
            <input
              ref={inputRef}
              name="message"
              autoFocus
              value={inputValue}
              onChange={(event) => {
                setCaret(event.target.selectionStart ?? event.target.value.length);
                onChange(serializeParts([...prefixParts, { type: "text", value: event.target.value }]));
              }}
              onSelect={(event) => {
                setCaret(event.currentTarget.selectionStart ?? 0);
              }}
              onKeyDownCapture={(event) => {
                if (event.key === " ") spaceKeyRef.current = true;
                if (mentionOpen && event.key === " ") {
                  event.stopPropagation();
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " ") spaceKeyRef.current = false;
              }}
              onKeyDown={(event) => {
                if (mentionOpen && event.key === " ") {
                  event.stopPropagation();
                }
                if (event.key === "Escape" && mentionOpen) {
                  event.preventDefault();
                  mentionDismissedRef.current = true;
                  setMentionOpen(false);
                  return;
                }
                if (event.key === "Backspace" && inputValue === "" && prefixParts.length > 0) {
                  event.preventDefault();
                  onChange(serializeParts(prefixParts.slice(0, -1)));
                  return;
                }
                if (!mentionOpen || options.length === 0) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightIndex((current) => (current + 1) % options.length);
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightIndex((current) => (current + options.length - 1) % options.length);
                }
              }}
              placeholder={prefixParts.length === 0 ? placeholder : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              suppressHydrationWarning
              className="min-w-[8ch] grow bg-transparent text-[13px]/[18px] text-[#141414] outline-none placeholder:text-[#1414145C]"
            />
          </div>
          <span className="shrink-0 text-[13px]/[18px] text-[#141414BD]">mtr</span>
          <button
            type="submit"
            aria-disabled={Boolean(disabled) || !value.trim()}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#141414] text-[#FCFCFC] aria-disabled:opacity-40"
            aria-label="Enviar"
          >
            <Icon icon={ArrowRight02Icon} size={14} color="#FCFCFC" />
          </button>
          <DropdownMenuContent
            anchor={barRef}
            side="top"
            align="start"
            sideOffset={8}
            finalFocus={inputRef}
            className="w-64 min-w-64 max-w-64 overflow-hidden"
          >
            {options.length === 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuItem disabled className="h-7">
                  Sin resultados
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              <>
                {folderOptions.length > 0 ? (
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Carpetas</DropdownMenuLabel>
                    <div className="max-h-[8.5rem] overflow-y-auto">
                      {folderOptions.map((option, index) => (
                        <MentionOptionItem
                          key={option.id}
                          option={option}
                          index={index}
                          highlighted={index === highlightIndex}
                          spaceKeyRef={spaceKeyRef}
                          onSelect={selectOption}
                        />
                      ))}
                    </div>
                  </DropdownMenuGroup>
                ) : null}
                {transcriptionOptions.length > 0 ? (
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Transcripciones</DropdownMenuLabel>
                    <div className="max-h-[13.25rem] overflow-y-auto">
                      {transcriptionOptions.map((option, index) => {
                        const optionIndex = folderOptions.length + index;
                        return (
                          <MentionOptionItem
                            key={option.id}
                            option={option}
                            index={optionIndex}
                            highlighted={optionIndex === highlightIndex}
                            spaceKeyRef={spaceKeyRef}
                            onSelect={selectOption}
                          />
                        );
                      })}
                    </div>
                  </DropdownMenuGroup>
                ) : null}
              </>
            )}
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </form>
  );
}
