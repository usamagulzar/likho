"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconSvgElement;
  /** Renders the label in this font, so each option previews its own face. */
  fontFamily?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-0.5 rounded-lg border border-border bg-sidebar p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const style: CSSProperties | undefined = option.fontFamily
          ? { fontFamily: option.fontFamily }
          : undefined;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            style={style}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className={cn(
              "flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
              checked
                ? "bg-pad text-foreground shadow-xs"
                : "text-secondary-foreground hover:text-foreground",
            )}
          >
            {option.icon && <Icon icon={option.icon} />}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
