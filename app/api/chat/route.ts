import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { uiMessageText } from "@/lib/message";
import { truncateTitle } from "@/lib/format";
import { buildRagSystemPrompt, retrieveChunks } from "@/lib/rag";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const runtime = "nodejs";

type ChatRequestBody = {
  messages: UIMessage[];
  chatId?: string | null;
  activeTranscriptionId?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  const messages = body.messages ?? [];
  const chatId = body.chatId;
  const activeTranscriptionId = body.activeTranscriptionId ?? null;

  if (!chatId) {
    return Response.json({ error: "chatId es obligatorio" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const question = lastUser ? uiMessageText(lastUser) : "";
  if (!question) {
    return Response.json({ error: "Falta el mensaje del usuario" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const chunks = await retrieveChunks(question, activeTranscriptionId);

  const { data: chat } = await supabase
    .from("mtr_chats")
    .select("id, title, active_transcription_id")
    .eq("id", chatId)
    .maybeSingle();

  if (!chat) {
    return Response.json({ error: "Chat no encontrado" }, { status: 404 });
  }

  let activeTitle: string | null = null;
  if (activeTranscriptionId) {
    const { data: transcription } = await supabase
      .from("mtr_transcriptions")
      .select("short_title, session_key, recorded_at")
      .eq("id", activeTranscriptionId)
      .maybeSingle();
    activeTitle = transcription?.short_title ?? transcription?.session_key ?? null;
  }

  const { error: userInsertError } = await supabase.from("mtr_chat_messages").insert({
    chat_id: chatId,
    role: "user",
    content: question,
  });

  if (userInsertError) {
    return Response.json({ error: userInsertError.message }, { status: 500 });
  }

  if (!chat.title) {
    await supabase
      .from("mtr_chats")
      .update({
        title: truncateTitle(question),
        active_transcription_id: activeTranscriptionId,
      })
      .eq("id", chatId);
  } else if (activeTranscriptionId !== chat.active_transcription_id) {
    await supabase
      .from("mtr_chats")
      .update({ active_transcription_id: activeTranscriptionId })
      .eq("id", chatId);
  }

  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: buildRagSystemPrompt(chunks, activeTitle),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted) return;
      const content = uiMessageText(responseMessage);
      if (!content) return;

      const { data: assistantRow, error: assistantError } = await supabase
        .from("mtr_chat_messages")
        .insert({
          chat_id: chatId,
          role: "assistant",
          content,
        })
        .select("id")
        .single();

      if (assistantError || !assistantRow) return;

      if (chunks.length > 0) {
        await supabase.from("mtr_chat_message_citations").insert(
          chunks.map((chunk) => ({
            message_id: assistantRow.id,
            chunk_id: chunk.id,
          })),
        );
      }

      await supabase.from("mtr_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId);
    },
  });
}
