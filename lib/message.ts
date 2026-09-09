import type { UIMessage } from "ai";

export function uiMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function toUiMessages(
  rows: Array<{ id: string; role: "user" | "assistant"; content: string }>,
): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export function isAboutActiveMeeting(question: string, hasActive: boolean): boolean {
  if (!hasActive) return false;
  return !/todas las (reuniones|transcripciones)|cualquier (reunión|reunion|transcripci[oó]n)|otras reuniones|en general/i.test(
    question,
  );
}
