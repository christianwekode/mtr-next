"use client";

import { DetailBody } from "@/components/transcription-pane/detail-body";
import { DetailSkeleton } from "@/components/transcription-pane/detail-skeleton";
import { listTitle } from "@/lib/format";
import type { TranscriptionDetail } from "@/lib/types";

export type TranscriptionPaneProps = {
  folderName: string | null;
  detail: TranscriptionDetail | null;
  loading: boolean;
};

export function TranscriptionPane({ folderName, detail, loading }: TranscriptionPaneProps) {
  const title = detail ? listTitle(detail) : "";
  const crumbsFolder = folderName ?? "Transcripciones";

  return (
    <section className="flex min-w-0 grow flex-col bg-white">
      <div className="flex h-10 w-full shrink-0 items-center gap-1 px-6">
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
      <div className="flex min-h-0 grow flex-col items-center overflow-y-auto px-12 pb-12 pt-6">
        {loading ? <DetailSkeleton /> : detail ? <DetailBody folderName={folderName} detail={detail} /> : null}
      </div>
    </section>
  );
}
