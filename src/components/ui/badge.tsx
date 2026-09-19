import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "amber" | "red" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  teal: "bg-positive-soft text-positive",
  amber: "bg-accent-soft text-accent-strong",
  red: "bg-negative-soft text-negative",
  neutral: "bg-surface-3 text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
