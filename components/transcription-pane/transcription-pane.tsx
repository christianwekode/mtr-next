"use client";

import { XIcon } from "lucide-react";
import { DetailBody } from "@/components/transcription-pane/detail-body";
import { DetailSkeleton } from "@/components/transcription-pane/detail-skeleton";
import { listTitle } from "@/lib/format";
import type { TranscriptionDetail } from "@/lib/types";

export type TranscriptionPaneProps = {
  folderName: string | null;
  detail: TranscriptionDetail | null;
  loading: boolean;
  onClose: () => void;
};

export function TranscriptionPane({ folderName, detail, loading, onClose }: TranscriptionPaneProps) {
  const title = detail ? listTitle(detail) : "";
  const crumbsFolder = folderName ?? "Transcripciones";

  return (
    <section className="flex min-w-0 grow flex-col bg-white">
      <div className="flex h-10 w-full shrink-0 items-center justify-between gap-1 px-6">
        <div className="flex min-w-0 items-center gap-1">
          {loading ? (
            <>
              <span className="h-3 w-16 animate-pulse rounded bg-[#1414140F]" />
              <span className="px-1.5 text-[13px]/[18px] text-[#1414145C]">/</span>
              <span className="h-3 w-40 animate-pulse rounded bg-[#1414140F]" />
            </>
          ) : (
            <>
              <span className="text-[13px]/[18px] text-[#141414BD]">{crumbsFolder}</span>
              <span className="px-1.5 text-[13px]/[18px] text-[#1414145C]">/</span>
              <span className="truncate text-[13px]/[18px] text-[#141414]">{title}</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#141414A8] outline-none hover:bg-[#1414140F]"
          aria-label="Cerrar transcripción"
        >
          <XIcon size={16} />
        </button>
      </div>
      <div className="flex min-h-0 grow flex-col items-center overflow-y-auto px-12 pb-12 pt-6">
        {loading ? <DetailSkeleton /> : detail ? <DetailBody folderName={folderName} detail={detail} /> : null}
      </div>
    </section>
  );
}
