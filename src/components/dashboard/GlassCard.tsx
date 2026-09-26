import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Dark, glass-style card used only on the dashboard for now. The rest of the
 * app keeps the original light `Card` component — this is intentionally a
 * separate component so nothing else changes.
 */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.2)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
