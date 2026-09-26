import { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const TONES: Record<string, { bg: string; text: string }> = {
  purple: { bg: "bg-[#8D6CE6]/15", text: "text-[#B7A3F5]" },
  teal: { bg: "bg-[#7ECED4]/15", text: "text-[#9FE0E4]" },
  pink: { bg: "bg-[#D780D6]/15", text: "text-[#E5A6E1]" },
  neutral: { bg: "bg-white/10", text: "text-white/80" },
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
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.065] p-4 backdrop-blur-sm">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", t.bg, t.text)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/50">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-white">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}
