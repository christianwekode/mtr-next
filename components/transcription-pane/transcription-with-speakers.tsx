"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssignSpeakerDialog } from "@/components/transcription-pane/assign-speaker-dialog";
import { usePlayback } from "@/components/playback-context";
import { formatPlaybackClock } from "@/lib/format";
import { updateTranscriptionTranscript } from "@/lib/mtr";
import {
  assignSpeaker,
  assignedPerson,
  avatarUrl,
  diarizationKey,
  isNamedSpeaker,
  knownPeople,
  segmentsForSpeaker,
  segmentStart,
  speakerLabel,
  speakerOrdinals,
  speakingSeconds,
} from "@/lib/transcript-speakers";
import type { ElevenLabsSpeaker, ElevenLabsTranscript } from "@/lib/types";

export type TranscriptionWithSpeakersProps = {
  transcriptionId: string;
  title: string;
  durationSeconds: number | null;
  hasAudio: boolean;
  transcript: ElevenLabsTranscript;
};

function PlayMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        d="M7 5.2v13.6a1 1 0 0 0 1.52.85l11.1-6.8a1 1 0 0 0 0-1.7L8.52 4.35A1 1 0 0 0 7 5.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TranscriptionWithSpeakers({
  transcriptionId,
  title,
  durationSeconds,
  hasAudio,
  transcript: source,
}: TranscriptionWithSpeakersProps) {
  const { playFrom } = usePlayback();
  const [transcript, setTranscript] = useState(source);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef({
    label: "Usuario",
    lines: [] as { start: number; text: string }[],
    speakingSeconds: 0,
    person: null as ElevenLabsSpeaker | null,
    people: [] as ElevenLabsSpeaker[],
  });

  useEffect(() => {
    setTranscript(source);
    setActiveKey(null);
  }, [transcriptionId, source]);

  const segments = transcript.segments ?? [];
  const ordinals = speakerOrdinals(segments);
  const visible = segments.flatMap((segment, index) => {
    if (!segment?.text?.trim()) return [];
    const key = diarizationKey(segment, index);
    return [{ segment, index, key, ordinal: ordinals.get(key) ?? index + 1 }];
  });

  if (visible.length === 0) {
    return <p className="text-[13px]/5 text-[#141414]">Esta transcripción no tiene texto todavía.</p>;
  }

  const activeItem = visible.find((item) => item.key === activeKey);
  const dialogModel = {
    label: activeItem ? speakerLabel(activeItem.segment, activeItem.ordinal) : "Usuario",
    lines: activeKey
      ? segmentsForSpeaker(segments, activeKey).map((segment) => ({
          start: segmentStart(segment),
          text: segment.text.trim(),
        }))
      : [],
    speakingSeconds: speakingSeconds(activeKey ? segmentsForSpeaker(segments, activeKey) : []),
    person: activeKey ? assignedPerson(segments, activeKey) : null,
    people: knownPeople(segments),
  };
  if (activeKey) dialogRef.current = dialogModel;
  const dialog = activeKey ? dialogModel : dialogRef.current;

  async function handleAssign(person: ElevenLabsSpeaker) {
    if (!activeKey) return;
    const previous = transcript;
    const next = assignSpeaker(transcript, activeKey, person);
    setTranscript(next);
    setSaving(true);
    setError(null);
    try {
      await updateTranscriptionTranscript(transcriptionId, next);
      setActiveKey(null);
    } catch (assignError) {
      setTranscript(previous);
      setError(assignError instanceof Error ? assignError.message : "No se pudo asignar la persona");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article className="flex w-[640px] max-w-full flex-col gap-6">
        {visible.map(({ segment, index, key, ordinal }) => {
          const named = isNamedSpeaker(segment);
          const label = speakerLabel(segment, ordinal);
          const start = segmentStart(segment);
          const clock = formatPlaybackClock(start, start);
          const paragraphs = segment.text
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

          return (
            <section key={`${key}-${index}`} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {named ? (
                  <>
                    <img
                      src={avatarUrl(segment.speaker.id.trim() || label)}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setActiveKey(key);
                      }}
                      className="cursor-pointer rounded-md font-sans text-[13px]/5 font-semibold text-[#141414] outline-none hover:bg-[#1414140F]"
                    >
                      {label}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setActiveKey(key);
                    }}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full py-0.5 pr-1.5 pl-0.5 outline-none hover:bg-[#1414140A] ${
                      activeKey === key ? "bg-[#1414140F]" : ""
                    }`}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-[#14141438] bg-[#1414140F] font-sans text-[11px]/3 font-semibold text-[#141414A8]">
                      {ordinal}
                    </span>
                    <span className="font-sans text-[13px]/5 font-semibold text-[#141414]">{label}</span>
                    <ChevronDownIcon className="size-3 shrink-0 text-[#1414147A]" strokeWidth={2.2} />
                  </button>
                )}
                <button
                  type="button"
                  disabled={!hasAudio}
                  aria-label={`Reproducir desde ${clock}`}
                  onClick={() => {
                    void playFrom({ id: transcriptionId, title, durationSeconds }, start).catch(() => {});
                  }}
                  className="flex h-5 cursor-pointer items-center gap-1 rounded-full bg-[#1414140A] pr-1.75 pl-1.25 text-[#141414] outline-none hover:bg-[#14141414] disabled:cursor-default disabled:opacity-60"
                >
                  <PlayMark />
                  <span className="font-sans text-xs/4 text-[#141414BD]">{clock}</span>
                </button>
              </div>
              <div className={`flex flex-col gap-2.5 ${named ? "pl-7" : "pl-7.5"}`}>
                {paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="font-sans text-[13px]/5 whitespace-pre-wrap text-[#141414]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </article>
      <AssignSpeakerDialog
        open={activeKey != null}
        label={dialog.label}
        people={dialog.people}
        lines={dialog.lines}
        speakingSeconds={dialog.speakingSeconds}
        initialPerson={dialog.person}
        saving={saving}
        error={error}
        onOpenChange={(open) => {
          if (!open) {
            setActiveKey(null);
            setError(null);
          }
        }}
        onAssign={(person) => {
          void handleAssign(person);
        }}
      />
    </>
  );
}
