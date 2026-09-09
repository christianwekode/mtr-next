import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAboutActiveMeeting } from "@/lib/message";
import { formatRecordedAt } from "@/lib/format";
import type { MatchedChunk } from "@/lib/types";

const MATCH_COUNT = 8;

type RankedChunk = MatchedChunk & {
  short_title: string | null;
  recorded_at: string | null;
};

export async function retrieveChunks(question: string, activeTranscriptionId: string | null): Promise<RankedChunk[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: question,
  });

  const filter = isAboutActiveMeeting(question, Boolean(activeTranscriptionId))
    ? [activeTranscriptionId as string]
    : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("mtr_match_transcription_chunks", {
    query_embedding: embedding,
    match_count: MATCH_COUNT,
    filter_transcription_ids: filter,
  });

  if (error) {
    throw new Error(error.message);
  }

  const matches = (data ?? []) as MatchedChunk[];
  if (matches.length === 0) return [];

  const ids = [...new Set(matches.map((match) => match.transcription_id))];
  const { data: transcriptions, error: txError } = await supabase
    .from("mtr_transcriptions")
    .select("id, short_title, recorded_at")
    .in("id", ids);

  if (txError) {
    throw new Error(txError.message);
  }

  const meta = new Map(
    (transcriptions ?? []).map((row: { id: string; short_title: string | null; recorded_at: string }) => [
      row.id,
      row,
    ]),
  );

  return matches.map((match) => {
    const info = meta.get(match.transcription_id);
    return {
      ...match,
      short_title: info?.short_title ?? null,
      recorded_at: info?.recorded_at ?? null,
    };
  });
}

export function buildRagSystemPrompt(chunks: RankedChunk[], activeTitle: string | null): string {
  const evidence =
    chunks.length === 0
      ? "(No hay fragmentos recuperados.)"
      : chunks
          .map((chunk, index) => {
            const title = chunk.short_title?.trim() || "Transcripción";
            const date = chunk.recorded_at ? formatRecordedAt(chunk.recorded_at) : "";
            const heading = date ? `${title} · ${date}` : title;
            return `[${index + 1}] ${heading} (chunk ${chunk.chunk_index})\n${chunk.content}`;
          })
          .join("\n\n");

  const focus = activeTitle
    ? `Hay una transcripción abierta: "${activeTitle}". Si la pregunta habla de "esta" reunión, prioriza esos fragmentos. Si pregunta por otras reuniones o por todas, usa cualquier fragmento.`
    : "No hay una transcripción abierta. Busca en todas las reuniones.";

  return `Eres el asistente de transcripciones de reuniones (mtr). Solo puedes responder con la evidencia de los fragmentos. Si no hay evidencia suficiente, dilo con claridad. No inventes acuerdos, fechas ni nombres.

${focus}

Responde en el mismo idioma que la pregunta, si es en catalan responde en catalan, si la pregunta es en castellano responde en castellano, si la pregunta es en ingles responde en ingles y así con todos los idiomas. Citas, títulos y nombres propios déjalos como aparecen en los fragmentos. Usa lenguaje natural y puede usar viñetas con "- " para listas de elementos pero no uses listas para enumerar tus propias frases de respuestas. Cuando cites algo, menciona la reunión (título y fecha).

Fragmentos:
${evidence}`;
}
