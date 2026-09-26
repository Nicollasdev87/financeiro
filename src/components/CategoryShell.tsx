"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Textarea que cresce conforme o texto, para dar a sensação de espaço livre. */
function AutoGrowTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ex: estou somando todos os gastos aqui, gastei X disso na segunda..."
      rows={2}
      className="w-full resize-none overflow-hidden rounded-control border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    />
  );
}

export function CategoryShell({
  color,
  name,
  natureLabel,
  totalDisplay,
  description,
  notes,
  onNotesChange,
  defaultOpen = false,
  children,
}: {
  color: string;
  name: string;
  natureLabel?: string;
  totalDisplay: ReactNode;
  description?: string | null;
  notes?: string;
  onNotesChange?: (value: string) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-card border border-border/70 bg-surface transition-shadow hover:shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate font-medium">{name}</span>
          {natureLabel && (
            <span className="hidden shrink-0 text-xs text-text-secondary sm:inline">{natureLabel}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {totalDisplay}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-secondary transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 border-t border-border/70 px-4 pb-4 pt-3.5">
            {description && (
              <p className="text-xs leading-relaxed text-text-secondary">{description}</p>
            )}

            {children}

            {onNotesChange && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">Observações</label>
                <AutoGrowTextarea value={notes ?? ""} onChange={onNotesChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
