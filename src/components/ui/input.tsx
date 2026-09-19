import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
