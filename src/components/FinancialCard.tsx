import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn, formatCurrency } from "@/lib/utils";

export function FinancialCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "danger" | "primary";
}) {
  const tones = {
    neutral: "text-text bg-black/5",
    success: "text-success bg-success/10",
    danger: "text-danger bg-danger/10",
    primary: "text-primary bg-primary-light",
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-control", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="truncate text-xl font-semibold tabular-nums">{formatCurrency(value)}</p>
      </div>
    </Card>
  );
}
