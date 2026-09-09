import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

type IconProps = {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  size?: number;
  className?: string;
  color?: string;
};

export function Icon({ icon, size = 16, className, color = "currentColor" }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={1.75}
      className={className}
    />
  );
}
