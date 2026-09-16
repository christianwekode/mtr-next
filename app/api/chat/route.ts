import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { listTitle, truncateTitle } from "@/lib/format";
import { uiMessageText } from "@/lib/message";
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
  const [chunks, chatRes, transcriptionRes, modelMessages] = await Promise.all([
    retrieveChunks(question, activeTranscriptionId),
    supabase.from("mtr_chats").select("id, title, active_transcription_id").eq("id", chatId).maybeSingle(),
    activeTranscriptionId
      ? supabase
          .from("mtr_transcriptions")
          .select("short_title, session_key, recorded_at")
          .eq("id", activeTranscriptionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    convertToModelMessages(messages),
  ]);

  if (!chatRes.data) {
    return Response.json({ error: "Chat no encontrado" }, { status: 404 });
  }

  const chat = chatRes.data;
  const activeTitle = transcriptionRes.data ? listTitle(transcriptionRes.data) : null;

  const chatPatch: { title?: string; active_transcription_id?: string | null } = {};
  if (!chat.title) chatPatch.title = truncateTitle(question);
  if (activeTranscriptionId !== chat.active_transcription_id) {
    chatPatch.active_transcription_id = activeTranscriptionId;
  }

  const [userInsert] = await Promise.all([
    supabase.from("mtr_chat_messages").insert({
      chat_id: chatId,
      role: "user",
      content: question,
    }),
    Object.keys(chatPatch).length > 0
      ? supabase.from("mtr_chats").update(chatPatch).eq("id", chatId)
      : Promise.resolve({ error: null }),
  ]);

  if (userInsert.error) {
    return Response.json({ error: userInsert.error.message }, { status: 500 });
  }

  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: buildRagSystemPrompt(chunks, activeTitle),
    messages: modelMessages,
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

      await Promise.all([
        chunks.length > 0
          ? supabase.from("mtr_chat_message_citations").insert(
              chunks.map((chunk) => ({
                message_id: assistantRow.id,
                chunk_id: chunk.id,
              })),
            )
          : Promise.resolve(),
        supabase.from("mtr_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId),
      ]);
    },
  });
}
