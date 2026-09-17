import { File02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { listTitle } from "@/lib/format";
import type { TranscriptionListItem } from "@/lib/types";

export type TranscriptionRowProps = {
  item: TranscriptionListItem;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function TranscriptionRow({ item, selected, onSelect }: TranscriptionRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`flex h-8 w-full shrink-0 items-center gap-2 overflow-hidden rounded-lg p-2 text-left ${
        selected ? "bg-[#1414140F]" : ""
      }`}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {item.status === "processing" ? (
          <Icon icon={Loading03Icon} size={16} className="animate-spin" color="#6bd668" />
        ) : (
          <Icon icon={File02Icon} size={16} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px]/[18px] text-[#141414]">
        {listTitle(item)}
      </span>
    </button>
  );
}
