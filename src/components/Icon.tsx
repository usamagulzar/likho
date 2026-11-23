import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: IconSvgElement;
  className?: string;
}

/** The one icon size and stroke used across the app (Hugeicons, stroke rounded). */
export function Icon({ icon, className }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={18}
      strokeWidth={1.5}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    />
  );
}
