import type { UIMessage } from "ai";
import { Streamdown } from "streamdown";
import { MentionBadge } from "@/components/mention-badge";
import { parseMessageParts, type MentionKind } from "@/lib/mentions";
import { uiMessageText } from "@/lib/message";

export type ChatMessageProps = {
  message: UIMessage;
  compact: boolean;
  streaming: boolean;
  onMentionClick: (id: string, kind: MentionKind) => void;
};

export function ChatMessage({ message, compact, streaming, onMentionClick }: ChatMessageProps) {
  const text = uiMessageText(message);
  const width = compact ? "w-full" : "w-[640px] max-w-full";

  if (message.role === "user") {
    return (
      <div className={`flex ${width}`}>
        <div className="w-fit max-w-full rounded-2xl border border-[#14141414] bg-[#F5F5F5] px-3.5 py-2.5">
          <p className="inline-flex max-w-full flex-wrap items-center gap-1 text-[13px]/[18px] text-[#141414]">
            {parseMessageParts(text).map((part, index) =>
              part.type === "mention" ? (
                <MentionBadge
                  key={`${part.kind}-${part.id}-${index}`}
                  id={part.id}
                  kind={part.kind}
                  label={part.label}
                  onMentionClick={onMentionClick}
                />
              ) : (
                <span key={`text-${index}`}>{part.value}</span>
              ),
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${width}`}>
      {text ? (
        <Streamdown
          mode={streaming ? "streaming" : "static"}
          animated={streaming}
          controls={false}
          className="prose prose-neutral max-w-none prose-headings:mb-0 prose-headings:mt-0 prose-headings:text-[13px]/5 prose-headings:font-semibold prose-p:my-0 prose-p:text-[13px]/5 prose-p:text-[#141414] prose-li:text-[13px]/5 prose-ul:my-0 prose-ol:my-0"
        >
          {text}
        </Streamdown>
      ) : (
        <p className="text-[13px]/5 text-[#141414BD]">…</p>
      )}
    </div>
  );
}
