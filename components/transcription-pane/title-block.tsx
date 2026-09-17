import { TranscriptionPlayButton } from "@/components/transcription-player/transcription-play-button";
import { formatDuration, formatRecordedAt, listTitle } from "@/lib/format";
import type { TranscriptionDetail } from "@/lib/types";

export type TitleBlockProps = {
  folderName: string | null;
  detail: TranscriptionDetail;
};

export function TitleBlock({ folderName, detail }: TitleBlockProps) {
  const meta = [
    folderName,
    formatRecordedAt(detail.recorded_at),
    formatDuration(detail.duration_seconds),
    detail.language,
  ].filter(Boolean);

  return (
    <div className="flex w-[640px] max-w-full flex-col gap-2 pb-8">
      <div className="flex items-center gap-2.5">
        {detail.audio_storage_path ? (
          <TranscriptionPlayButton
            transcriptionId={detail.id}
            title={listTitle(detail)}
            durationSeconds={detail.duration_seconds}
          />
        ) : null}
        <h1 className="min-w-0 font-sans text-xl/7 text-[#141414]">{listTitle(detail)}</h1>
      </div>
      <p className="text-xs leading-4 text-[#141414BD]">{meta.join(" · ")}</p>
    </div>
  );
}
