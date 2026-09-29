export type TranscriptionStatus = "processing" | "ready" | "failed";

export type Folder = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type TranscriptionListItem = {
  id: string;
  short_title: string | null;
  status: TranscriptionStatus;
  folder_id: string | null;
  recorded_at: string;
  session_key: string;
};

export type ElevenLabsSpeaker = {
  id: string;
  name: string;
};

export type ElevenLabsWord = {
  text?: string;
  start?: number;
  end?: number;
  type?: string;
  speaker_id?: string | null;
};

export type ElevenLabsSegment = {
  text: string;
  start?: number;
  speaker: ElevenLabsSpeaker;
  words?: ElevenLabsWord[];
};

export type ElevenLabsTranscript = {
  segments: ElevenLabsSegment[];
  language_code: string | null;
};

export type TranscriptionDetail = TranscriptionListItem & {
  body: string | null;
  language: string | null;
  duration_seconds: number | null;
  fragment_count: number | null;
  audio_storage_path: string | null;
  error_message: string | null;
  elevenlabs_transcript: ElevenLabsTranscript | null;
};

export type ChatRow = {
  id: string;
  title: string | null;
  active_transcription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type MatchedChunk = {
  id: string;
  transcription_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
};
