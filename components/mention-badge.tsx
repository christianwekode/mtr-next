import { Cancel01Icon, File02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";

export function MentionBadge({
  id,
  label,
  onOpen,
  onRemove,
}: {
  id: string;
  label: string;
  onOpen: (id: string) => void;
  onRemove?: () => void;
}) {
  const inComposer = Boolean(onRemove);

  return (
    <Badge
      render={<span />}
      className={cn(
        "group/mention max-w-full cursor-pointer rounded-sm text-sky-600",
        inComposer
          ? "bg-sky-600/20 pr-2 pl-1.5 hover:bg-sky-600/25"
          : "h-auto gap-0.5 bg-transparent p-0 hover:bg-transparent",
      )}
    >
      <span className="relative grid size-3 shrink-0 place-items-center">
        <Icon
          icon={File02Icon}
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
          onOpen(id);
        }}
        aria-label={`Abrir transcripción ${label}`}
      >
        {label}
      </button>
    </Badge>
  );
}
