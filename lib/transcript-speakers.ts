import { formatDuration } from "@/lib/format";
import type { ElevenLabsSegment, ElevenLabsSpeaker, ElevenLabsTranscript } from "@/lib/types";

export function segmentStart(segment: ElevenLabsSegment): number {
  return typeof segment.start === "number" && Number.isFinite(segment.start) ? Math.max(0, segment.start) : 0;
}

export function diarizationKey(segment: ElevenLabsSegment, index: number): string {
  const fromWords = segment.words?.find((word) => word.speaker_id?.trim())?.speaker_id?.trim();
  if (fromWords) return fromWords;
  const speakerId = segment.speaker?.id?.trim();
  if (speakerId && !segment.speaker?.name?.trim()) return speakerId;
  if (speakerId) return `person:${speakerId}`;
  return `segment-${index}`;
}

export function speakerOrdinals(segments: ElevenLabsSegment[]): Map<string, number> {
  const ordinals = new Map<string, number>();
  segments.forEach((segment, index) => {
    const key = diarizationKey(segment, index);
    if (!ordinals.has(key)) ordinals.set(key, ordinals.size + 1);
  });
  return ordinals;
}

export function isNamedSpeaker(segment: ElevenLabsSegment): boolean {
  return Boolean(segment.speaker?.name?.trim());
}

export function speakerLabel(segment: ElevenLabsSegment, ordinal: number): string {
  return segment.speaker?.name?.trim() || `Usuario ${ordinal}`;
}

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}

export function knownPeople(segments: ElevenLabsSegment[]): ElevenLabsSpeaker[] {
  const people = new Map<string, ElevenLabsSpeaker>();
  for (const segment of segments) {
    const name = segment.speaker?.name?.trim();
    if (!name) continue;
    const id = segment.speaker.id?.trim() || name;
    if (!people.has(id)) people.set(id, { id, name });
  }
  return [...people.values()];
}

export function assignedPerson(segments: ElevenLabsSegment[], key: string): ElevenLabsSpeaker | null {
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment || diarizationKey(segment, index) !== key) continue;
    const name = segment.speaker?.name?.trim();
    if (!name) continue;
    return { id: segment.speaker.id?.trim() || name, name };
  }
  return null;
}

export function segmentsForSpeaker(segments: ElevenLabsSegment[], key: string): ElevenLabsSegment[] {
  return segments.filter((segment, index) => diarizationKey(segment, index) === key && segment.text?.trim());
}

export function speakingSeconds(segments: ElevenLabsSegment[]): number {
  return segments.reduce((total, segment) => {
    const words = segment.words ?? [];
    const starts = words.flatMap((word) => (typeof word.start === "number" ? [word.start] : []));
    const ends = words.flatMap((word) => (typeof word.end === "number" ? [word.end] : []));
    if (starts.length === 0 || ends.length === 0) return total;
    return total + Math.max(0, Math.max(...ends) - Math.min(...starts));
  }, 0);
}

export function interventionsLabel(count: number, seconds: number): string {
  const noun = count === 1 ? "intervención" : "intervenciones";
  const duration = seconds > 0 ? formatDuration(seconds) : null;
  return duration ? `${count} ${noun} · ${duration}` : `${count} ${noun}`;
}

export function assignSpeaker(
  transcript: ElevenLabsTranscript,
  key: string,
  person: ElevenLabsSpeaker,
): ElevenLabsTranscript {
  return {
    ...transcript,
    segments: transcript.segments.map((segment, index) =>
      diarizationKey(segment, index) === key ? { ...segment, speaker: { id: person.id, name: person.name } } : segment,
    ),
  };
}
