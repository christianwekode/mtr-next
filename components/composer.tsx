"use client";

import { Add01Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  wide?: boolean;
  onAttachAudio: () => void;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  wide,
  onAttachAudio,
}: ComposerProps) {
  return (
    <form
      className={`flex w-full items-center justify-center ${wide ? "px-6 pb-6" : "px-4 pb-4"}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim() || disabled) return;
        onSubmit();
      }}
    >
      <div
        className={`flex min-h-11 items-center gap-3 rounded-3xl border border-[#1414141F] bg-white px-3 py-1 ${
          wide ? "w-full max-w-3xl" : "w-full"
        }`}
      >
        <button
          type="button"
          onClick={onAttachAudio}
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1414140F] text-[#141414A8]"
          aria-label="Subir audio"
        >
          <Icon icon={Add01Icon} size={14} />
        </button>
        <input
          name="message"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={Boolean(disabled)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          suppressHydrationWarning
          className="min-w-0 grow bg-transparent text-[13px]/[18px] text-[#141414] outline-none placeholder:text-[#1414145C] disabled:opacity-60"
        />
        <span className="shrink-0 text-[13px]/[18px] text-[#141414BD]">mtr</span>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#141414] text-[#FCFCFC] disabled:opacity-40"
          aria-label="Enviar"
        >
          <Icon icon={ArrowRight02Icon} size={14} color="#FCFCFC" />
        </button>
      </div>
    </form>
  );
}
