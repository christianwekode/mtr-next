import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { listTitle, truncateTitle } from "@/lib/format";
import { toPlainChatText, toTitleText } from "@/lib/mentions";
import { uiMessageText } from "@/lib/message";
import { buildRagSystemPrompt, retrieveChunks } from "@/lib/rag";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const runtime = "nodejs";

type ChatRequestBody = {
  messages: UIMessage[];
  chatId?: string | null;
  activeTranscriptionId?: string | null;
  activeFolderId?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  const messages = body.messages ?? [];
  const chatId = body.chatId;
  const activeTranscriptionId = body.activeTranscriptionId ?? null;
  const activeFolderId = body.activeFolderId ?? null;

  if (!chatId) {
    return Response.json({ error: "chatId es obligatorio" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const rawQuestion = lastUser ? uiMessageText(lastUser) : "";
  const question = toPlainChatText(rawQuestion);
  if (!question) {
    return Response.json({ error: "Falta el mensaje del usuario" }, { status: 400 });
  }

  const modelInput = messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      part.type === "text" ? { ...part, text: toPlainChatText(part.text) } : part,
    ),
  }));

  const supabase = getSupabaseAdmin();
  const [chunks, chatRes, transcriptionRes, folderRes, modelMessages] = await Promise.all([
    retrieveChunks(question, activeTranscriptionId, activeFolderId),
    supabase.from("mtr_chats").select("id, title, active_transcription_id").eq("id", chatId).is("deleted_at", null).maybeSingle(),
    activeTranscriptionId
      ? supabase
          .from("mtr_transcriptions")
          .select("short_title, session_key, recorded_at")
          .eq("id", activeTranscriptionId)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    activeFolderId
      ? supabase.from("mtr_folders").select("name").eq("id", activeFolderId).is("deleted_at", null).maybeSingle()
      : Promise.resolve({ data: null }),
    convertToModelMessages(modelInput),
  ]);

  if (!chatRes.data) {
    return Response.json({ error: "Chat no encontrado" }, { status: 404 });
  }

  const chat = chatRes.data;
  const activeTitle = transcriptionRes.data ? listTitle(transcriptionRes.data) : null;
  const activeFolderName = folderRes.data?.name ?? null;

  const chatPatch: { title?: string; active_transcription_id?: string | null } = {};
  if (!chat.title) chatPatch.title = truncateTitle(toTitleText(rawQuestion));
  if (activeTranscriptionId !== chat.active_transcription_id) {
    chatPatch.active_transcription_id = activeTranscriptionId;
  }

  const [userInsert] = await Promise.all([
    supabase.from("mtr_chat_messages").insert({
      chat_id: chatId,
      role: "user",
      content: rawQuestion,
    }),
    Object.keys(chatPatch).length > 0
      ? supabase.from("mtr_chats").update(chatPatch).eq("id", chatId).is("deleted_at", null)
      : Promise.resolve({ error: null }),
  ]);

  if (userInsert.error) {
    return Response.json({ error: userInsert.error.message }, { status: 500 });
  }

  const result = streamText({
    model: openai("gpt-5.4-mini"),
    system: buildRagSystemPrompt(chunks, activeTitle, activeFolderName),
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
        supabase.from("mtr_chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId).is("deleted_at", null),
      ]);
    },
  });
}
