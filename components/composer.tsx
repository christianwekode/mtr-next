"use client";

import { Add01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { findActiveMention, normalizeSearch, serializeMention, serializeParts, splitComposerValue } from "@/lib/mentions";
import type { TranscriptionListItem } from "@/lib/types";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  wide?: boolean;
  transcriptions: TranscriptionListItem[];
  onOpenTranscription: (id: string) => void;
  onAttachAudio: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  wide,
  transcriptions,
  onOpenTranscription,
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

  const options = useMemo(() => {
    const needle = normalizeSearch(mentionQuery);
    return transcriptions
      .filter((item) => item.status !== "failed")
      .filter((item) => !needle || normalizeSearch(listTitle(item)).includes(needle));
  }, [mentionQuery, transcriptions]);

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
    if (disabled || mentionDismissedRef.current) return;
    setMentionOpen(true);
  }, [disabled, mentionQuery, mentionStart]);

  const selectTranscription = (item: TranscriptionListItem) => {
    if (!mention) return;
    const nextInput = `${inputValue.slice(0, mention.start)}${serializeMention(item.id, listTitle(item))} `;
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
          if (highlighted) selectTranscription(highlighted);
          return;
        }
        if (!value.trim() || disabled) return;
        onSubmit();
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
                  key={`${part.id}-${index}`}
                  id={part.id}
                  label={part.label}
                  onOpen={onOpenTranscription}
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
                  setHighlightIndex((current) => (current - 1 + options.length) % options.length);
                }
              }}
              placeholder={prefixParts.length === 0 ? placeholder : undefined}
              disabled={Boolean(disabled)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              suppressHydrationWarning
              className="min-w-[8ch] grow bg-transparent text-[13px]/[18px] text-[#141414] outline-none placeholder:text-[#1414145C] disabled:opacity-60"
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
            <DropdownMenuGroup>
              <DropdownMenuLabel>Transcripciones</DropdownMenuLabel>
              <div className="max-h-[13.25rem] overflow-y-auto">
                {options.length === 0 ? (
                  <DropdownMenuItem disabled className="h-7">
                    Sin resultados
                  </DropdownMenuItem>
                ) : (
                  options.map((item, index) => (
                    <DropdownMenuItem
                      key={item.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (spaceKeyRef.current) return;
                        selectTranscription(item);
                      }}
                      className={`h-7 ${index === highlightIndex ? "bg-accent" : ""}`}
                      data-mention-option={index}
                    >
                      <span className="min-w-0 truncate">{listTitle(item)}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </form>
  );
}
