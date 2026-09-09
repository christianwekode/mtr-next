import { openai } from "@ai-sdk/openai";
import { embedMany, transcribe } from "ai";
import { chunkTranscription } from "@/lib/chunk";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const AUDIO_BUCKET = "mtr-audio";

export async function processTranscription(transcriptionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: row, error: loadError } = await supabase
    .from("mtr_transcriptions")
    .select("id, audio_storage_path")
    .eq("id", transcriptionId)
    .single();

  if (loadError || !row) {
    throw new Error(loadError?.message ?? "Transcripción no encontrada");
  }

  if (!row.audio_storage_path) {
    throw new Error("La transcripción no tiene audio_storage_path");
  }

  try {
    const { data: file, error: downloadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .download(row.audio_storage_path);

    if (downloadError || !file) {
      throw new Error(downloadError?.message ?? "No se pudo descargar el audio");
    }

    const audio = new Uint8Array(await file.arrayBuffer());
    const transcript = await transcribe({
      model: openai.transcription("whisper-1"),
      audio,
    });

    const body = transcript.text.trim();
    const chunks = chunkTranscription(body);

    await supabase.from("mtr_transcription_chunks").delete().eq("transcription_id", transcriptionId);

    if (chunks.length > 0) {
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: chunks.map((chunk) => chunk.content),
      });

      const { error: chunkError } = await supabase.from("mtr_transcription_chunks").insert(
        chunks.map((chunk, index) => ({
          transcription_id: transcriptionId,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          embedding: embeddings[index],
          char_start: chunk.char_start,
          char_end: chunk.char_end,
        })),
      );

      if (chunkError) {
        throw new Error(chunkError.message);
      }
    }

    const { error: updateError } = await supabase
      .from("mtr_transcriptions")
      .update({
        body,
        language: transcript.language ?? null,
        duration_seconds:
          transcript.durationInSeconds != null ? Math.round(transcript.durationInSeconds) : null,
        fragment_count: chunks.length,
        status: "ready",
        error_message: null,
      })
      .eq("id", transcriptionId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al transcribir";
    await supabase
      .from("mtr_transcriptions")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", transcriptionId);
    throw error;
  }
}

export { AUDIO_BUCKET };
