export type TextChunk = {
  chunk_index: number;
  content: string;
  char_start: number;
  char_end: number;
};

const TARGET_CHARS = 800;
const OVERLAP_CHARS = 80;

function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…])\s+/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function windowsFromLongText(text: string, globalStart: number): Array<{ content: string; char_start: number; char_end: number }> {
  const sentences = splitSentences(text);
  if (sentences.length <= 1 && text.length <= TARGET_CHARS) {
    return [{ content: text, char_start: globalStart, char_end: globalStart + text.length }];
  }

  const pieces = sentences.length > 1 ? sentences : chunkBySize(text, TARGET_CHARS);
  const windows: Array<{ content: string; char_start: number; char_end: number }> = [];
  let cursor = globalStart;
  let buffer = "";
  let bufferStart = cursor;

  for (const piece of pieces) {
    const next = buffer ? `${buffer} ${piece}` : piece;
    if (buffer && next.length > TARGET_CHARS) {
      windows.push({
        content: buffer,
        char_start: bufferStart,
        char_end: bufferStart + buffer.length,
      });
      const overlap = buffer.slice(Math.max(0, buffer.length - OVERLAP_CHARS));
      buffer = overlap ? `${overlap} ${piece}` : piece;
      bufferStart = bufferStart + Math.max(0, (windows.at(-1)?.content.length ?? 0) - overlap.length);
      cursor = bufferStart + buffer.length;
    } else {
      if (!buffer) bufferStart = cursor;
      buffer = next;
      cursor = bufferStart + buffer.length;
    }
  }

  if (buffer) {
    windows.push({
      content: buffer,
      char_start: bufferStart,
      char_end: bufferStart + buffer.length,
    });
  }

  return windows;
}

function chunkBySize(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}

export function chunkTranscription(body: string): TextChunk[] {
  const text = body.trim();
  if (!text) return [];

  const paragraphs = text.split(/\n{2,}/);
  const packed: Array<{ content: string; char_start: number; char_end: number }> = [];
  let searchFrom = 0;
  let buffer = "";
  let bufferStart = 0;

  const flush = () => {
    if (!buffer.trim()) {
      buffer = "";
      return;
    }
    packed.push(...windowsFromLongText(buffer.trim(), bufferStart));
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    const start = text.indexOf(trimmed, searchFrom);
    const charStart = start >= 0 ? start : searchFrom;
    searchFrom = charStart + trimmed.length;

    if (!buffer) {
      buffer = trimmed;
      bufferStart = charStart;
      continue;
    }

    const next = `${buffer}\n\n${trimmed}`;
    if (next.length > TARGET_CHARS) {
      flush();
      buffer = trimmed;
      bufferStart = charStart;
    } else {
      buffer = next;
    }
  }

  flush();

  return packed.map((chunk, chunk_index) => ({
    chunk_index,
    ...chunk,
  }));
}
