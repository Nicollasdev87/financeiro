import { cn } from "@/lib/utils";

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-primary-light", className)}>
      <div
        className={cn("h-full rounded-full transition-all", over ? "bg-danger" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
