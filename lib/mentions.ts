const MENTION_RE = /@\[t:([^|\]]+)\|([^\]]+)\]/g;

export type MentionPart =
  | { type: "text"; value: string }
  | { type: "mention"; id: string; label: string };

export function serializeMention(id: string, label: string): string {
  return `@[t:${id}|${label.replace(/[\[\]]/g, "")}]`;
}

export function parseMessageParts(text: string): MentionPart[] {
  const parts: MentionPart[] = [];
  const pattern = new RegExp(MENTION_RE.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mention", id: match[1], label: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function serializeParts(parts: MentionPart[]): string {
  return parts
    .map((part) => (part.type === "mention" ? serializeMention(part.id, part.label) : part.value))
    .join("");
}

export function splitComposerValue(value: string): { prefixParts: MentionPart[]; inputValue: string } {
  const parts = parseMessageParts(value);
  const last = parts.at(-1);
  if (!last) return { prefixParts: [], inputValue: "" };
  if (last.type === "text") {
    return { prefixParts: parts.slice(0, -1), inputValue: last.value };
  }
  return { prefixParts: parts, inputValue: "" };
}

export function toPlainChatText(text: string): string {
  return text.replace(new RegExp(MENTION_RE.source, "g"), "@$2");
}

export function toTitleText(text: string): string {
  return text.replace(new RegExp(MENTION_RE.source, "g"), "$2");
}

export function lastMentionedTranscriptionId(text: string): string | null {
  const parts = parseMessageParts(text);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (part.type === "mention") return part.id;
  }
  return null;
}

export function findActiveMention(value: string, caret: number): { start: number; query: string } | null {
  const before = value.slice(0, caret);
  const match = before.match(/(^|[\s\u00A0])@([^@]*)$/);
  if (!match) return null;
  const query = match[2] ?? "";
  const start = caret - query.length - 1;
  return { start, query };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}
