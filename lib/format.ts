import type { TranscriptionListItem } from "@/lib/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function listTitle(item: Pick<TranscriptionListItem, "short_title" | "recorded_at" | "session_key">): string {
  if (item.short_title?.trim()) {
    return item.short_title.trim();
  }
  if (item.recorded_at) {
    return DATE_FORMATTER.format(new Date(item.recorded_at));
  }
  return item.session_key;
}

export function formatRecordedAt(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null || Number.isNaN(seconds)) {
    return null;
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function formatChatAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000));
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  return `${Math.floor(hours / 24)}d`;
}

export function chatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return DATE_FORMATTER.format(date);
}

export function formatMessageStamp(iso: string): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${chatDayLabel(iso)} ${time}`;
}

export function chatDisplayTitle(title: string | null): string {
  return title?.trim() || "Nuevo chat";
}

export function truncateTitle(text: string, max = 72): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trimEnd()}…`;
}
