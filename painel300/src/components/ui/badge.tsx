import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "amber" | "red" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  teal: "bg-teal/10 text-teal border-teal/30",
  amber: "bg-amber/10 text-amber border-amber/30",
  red: "bg-red/10 text-red border-red/30",
  neutral: "bg-surface-2 text-muted border-border-strong",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
