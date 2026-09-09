"use client";

import { formatDuration, formatRecordedAt, listTitle } from "@/lib/format";
import type { TranscriptionDetail } from "@/lib/types";

type TranscriptionPaneProps = {
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

function DetailBody({
  folderName,
  detail,
}: {
  folderName: string | null;
  detail: TranscriptionDetail;
}) {
  const meta = [
    folderName,
    formatRecordedAt(detail.recorded_at),
    formatDuration(detail.duration_seconds),
    detail.language,
  ].filter(Boolean);

  if (detail.status === "failed") {
    return (
      <div className="flex w-[640px] max-w-full flex-col gap-2 pb-8">
        <h1 className="font-sans text-xl/7 text-[#141414]">{listTitle(detail)}</h1>
        <p className="text-xs leading-4 text-[#141414BD]">{meta.join(" · ")}</p>
        <p className="pt-6 text-[13px]/5 text-[#141414]">
          {detail.error_message || "La transcripción falló."}
        </p>
      </div>
    );
  }

  if (detail.status === "processing") {
    return (
      <div className="flex w-[640px] max-w-full flex-col gap-2 pb-8">
        <h1 className="font-sans text-xl/7 text-[#141414]">{listTitle(detail)}</h1>
        <p className="text-xs leading-4 text-[#141414BD]">{meta.join(" · ")}</p>
        <p className="pt-6 text-[13px]/5 text-[#141414BD]">Transcribiendo el audio…</p>
      </div>
    );
  }

  const paragraphs = (detail.body ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      <div className="flex w-[640px] max-w-full flex-col gap-2 pb-8">
        <h1 className="font-sans text-xl/7 text-[#141414]">{listTitle(detail)}</h1>
        <p className="text-xs leading-4 text-[#141414BD]">{meta.join(" · ")}</p>
      </div>
      <article className="prose prose-neutral w-[640px] max-w-full prose-headings:mb-3 prose-headings:mt-0 prose-headings:text-[13px]/5 prose-headings:font-semibold prose-p:my-0 prose-p:mb-6 prose-p:text-[13px]/5 prose-p:text-[#141414] prose-li:text-[13px]/5">
        {paragraphs.length === 0 ? (
          <p>Esta transcripción no tiene texto todavía.</p>
        ) : (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          ))
        )}
      </article>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex w-[640px] max-w-full flex-col">
      <div className="flex flex-col gap-2 pb-8">
        <div className="h-7 w-72 animate-pulse rounded bg-[#1414140F]" />
        <div className="h-3 w-56 animate-pulse rounded bg-[#1414140A]" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 pb-6">
          <div className="h-4 w-40 animate-pulse rounded bg-[#1414140F]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#1414140A]" />
          <div className="h-4 w-[92%] animate-pulse rounded bg-[#1414140A]" />
          <div className="h-4 w-[76%] animate-pulse rounded bg-[#1414140A]" />
        </div>
      ))}
    </div>
  );
}
