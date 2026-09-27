import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Card do dashboard. Usa os mesmos tokens do resto do app (bg-surface,
 * border-border) — mantido como componente próprio só porque o dashboard
 * usa esse nome em vários lugares, mas visualmente é igual ao `Card` base.
 */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-border bg-surface p-5 shadow-card", className)}
      {...props}
    />
  );
}
