import { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const TONES: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success/10", text: "text-success" },
  danger: { bg: "bg-danger/10", text: "text-danger" },
  primary: { bg: "bg-primary/10", text: "text-primary" },
  neutral: { bg: "bg-surface-secondary", text: "text-text-secondary" },
};

export function StatChip({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className="flex items-center gap-3 rounded-card border border-border bg-surface p-4">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", t.bg, t.text)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-text">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
