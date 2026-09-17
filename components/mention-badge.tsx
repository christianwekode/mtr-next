import { Cancel01Icon, File02Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import type { MentionKind } from "@/lib/mentions";

const KIND_STYLES: Record<MentionKind, { color: string; composerBg: string }> = {
  transcription: {
    color: "text-sky-600",
    composerBg: "bg-sky-600/20 hover:bg-sky-600/25",
  },
  folder: {
    color: "text-amber-600",
    composerBg: "bg-amber-600/20 hover:bg-amber-600/25",
  },
};

export function MentionBadge({
  id,
  kind = "transcription",
  label,
  onMentionClick,
  onRemove,
}: {
  id: string;
  kind?: MentionKind;
  label: string;
  onMentionClick: (id: string, kind: MentionKind) => void;
  onRemove?: () => void;
}) {
  const inComposer = Boolean(onRemove);
  const styles = KIND_STYLES[kind];
  const clickLabel = kind === "folder" ? `Carpeta ${label}` : `Abrir transcripción ${label}`;

  return (
    <Badge
      render={<span />}
      className={cn(
        "group/mention max-w-full cursor-pointer rounded-sm",
        styles.color,
        inComposer
          ? cn("pr-2 pl-1.5", styles.composerBg)
          : "h-auto gap-0.5 bg-transparent p-0 hover:bg-transparent",
      )}
    >
      <span className="relative grid size-3 shrink-0 place-items-center">
        <Icon
          icon={kind === "folder" ? Folder02Icon : File02Icon}
          size={12}
          className={`col-start-1 row-start-1 size-3 ${inComposer ? "group-hover/mention:invisible" : ""}`}
        />
        {onRemove ? (
          <button
            type="button"
            className="col-start-1 row-start-1 z-10 hidden size-3 cursor-pointer items-center justify-center group-hover/mention:flex"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            aria-label={`Quitar mención ${label}`}
          >
            <Icon icon={Cancel01Icon} size={12} className="size-3" />
          </button>
        ) : null}
      </span>
      <button
        type="button"
        className="inline-block max-w-[120px] cursor-pointer truncate"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onMentionClick(id, kind);
        }}
        aria-label={clickLabel}
      >
        {label}
      </button>
    </Badge>
  );
}
