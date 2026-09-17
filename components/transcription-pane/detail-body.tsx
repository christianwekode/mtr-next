import { TitleBlock } from "@/components/transcription-pane/title-block";
import type { TranscriptionDetail } from "@/lib/types";

export type DetailBodyProps = {
  folderName: string | null;
  detail: TranscriptionDetail;
};

export function DetailBody({ folderName, detail }: DetailBodyProps) {
  if (detail.status === "failed") {
    return (
      <div className="flex w-[640px] max-w-full flex-col">
        <TitleBlock folderName={folderName} detail={detail} />
        <p className="text-[13px]/5 text-[#141414]">
          {detail.error_message || "La transcripción falló."}
        </p>
      </div>
    );
  }

  if (detail.status === "processing") {
    return (
      <div className="flex w-[640px] max-w-full flex-col">
        <TitleBlock folderName={folderName} detail={detail} />
        <p className="text-[13px]/5 text-[#141414BD]">Transcribiendo el audio…</p>
      </div>
    );
  }

  const paragraphs = (detail.body ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      <TitleBlock folderName={folderName} detail={detail} />
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
