import { File02Icon, Folder02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { MentionKind } from "@/lib/mentions";

export type MentionOption = {
  kind: MentionKind;
  id: string;
  label: string;
};

export type MentionOptionItemProps = {
  option: MentionOption;
  index: number;
  highlighted: boolean;
  spaceKeyRef: { current: boolean };
  onSelect: (option: MentionOption) => void;
};

export function MentionOptionItem({
  option,
  index,
  highlighted,
  spaceKeyRef,
  onSelect,
}: MentionOptionItemProps) {
  return (
    <DropdownMenuItem
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (spaceKeyRef.current) return;
        onSelect(option);
      }}
      className={`h-7 ${highlighted ? "bg-accent" : ""}`}
      data-mention-option={index}
    >
      <Icon
        icon={option.kind === "folder" ? Folder02Icon : File02Icon}
        size={14}
        className={`size-3.5 shrink-0 ${option.kind === "folder" ? "text-amber-600" : "text-sky-600"}`}
      />
      <span className="min-w-0 truncate">{option.label}</span>
    </DropdownMenuItem>
  );
}
