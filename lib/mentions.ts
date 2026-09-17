const MENTION_RE = /@\[(t|f):([^|\]]+)\|([^\]]+)\]/g;

export type MentionKind = "transcription" | "folder";

export type MentionPart =
  | { type: "text"; value: string }
  | { type: "mention"; kind: MentionKind; id: string; label: string };

const KIND_PREFIX: Record<MentionKind, "t" | "f"> = {
  transcription: "t",
  folder: "f",
};

function kindFromPrefix(prefix: string): MentionKind {
  return prefix === "f" ? "folder" : "transcription";
}

export function serializeMention(kind: MentionKind, id: string, label: string): string {
  return `@[${KIND_PREFIX[kind]}:${id}|${label.replace(/[\[\]]/g, "")}]`;
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
    parts.push({ type: "mention", kind: kindFromPrefix(match[1]), id: match[2], label: match[3] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function serializeParts(parts: MentionPart[]): string {
  return parts
    .map((part) =>
      part.type === "mention" ? serializeMention(part.kind, part.id, part.label) : part.value,
    )
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
  return text.replace(new RegExp(MENTION_RE.source, "g"), "@$3");
}

export function toTitleText(text: string): string {
  return text.replace(new RegExp(MENTION_RE.source, "g"), "$3");
}

export function lastMention(text: string): { kind: MentionKind; id: string } | null {
  const parts = parseMessageParts(text);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (part.type === "mention") return { kind: part.kind, id: part.id };
  }
  return null;
}

export function mentionFocus(text: string, selectedTranscriptionId: string | null) {
  const mention = lastMention(text);
  if (mention?.kind === "folder") {
    return { activeTranscriptionId: null, activeFolderId: mention.id };
  }
  return {
    activeTranscriptionId: mention?.id ?? selectedTranscriptionId,
    activeFolderId: null,
  };
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
