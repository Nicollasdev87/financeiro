"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onCommit: (value: number) => void;
  className?: string;
  placeholder?: string;
  align?: "left" | "right";
}

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Clique para editar, digite o número (formata como R$ enquanto você
 * digita, tipo maquininha), Enter (ou blur) confirma. Este é o
 * componente central da experiência "Meu mês".
 */
export function CurrencyInput({ value, onCommit, className, placeholder, align = "right" }: CurrencyInputProps) {
  const [editing, setEditing] = useState(false);
  const [cents, setCents] = useState(() => Math.round((value || 0) * 100));
  const inputRef = useRef<HTMLInputElement>(null);
  const alignClass = align === "left" ? "text-left" : "text-right";

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setCents(Math.round((value || 0) * 100));
    setEditing(true);
  }

  function commit() {
    const parsed = cents / 100;
    setEditing(false);
    if (parsed !== value) onCommit(parsed);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Só dígitos importam: cada tecla empurra a casa decimal, como
    // numa maquininha de cartão (ex: "4" "0" "0" "0" "0" -> 400,00).
    const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
    setCents(digits ? parseInt(digits, 10) : 0);
  }

  if (editing) {
    return (
      <div
        className={cn(
          "flex w-full items-center gap-1 rounded-control border border-primary bg-white px-2 py-1",
          className
        )}
      >
        <span className="shrink-0 select-none text-text-secondary">R$</span>
        <input
          ref={inputRef}
          inputMode="numeric"
          value={centsToDisplay(cents)}
          onChange={handleChange}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className={cn("w-full min-w-0 bg-transparent tabular-nums outline-none", alignClass)}
          placeholder={placeholder ?? "0,00"}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        "w-full rounded-control px-2 py-1 tabular-nums hover:bg-primary-light/60 transition-colors",
        alignClass,
        value === 0 && "text-text-secondary",
        className
      )}
    >
      {value ? formatCurrency(value) : "R$ 0,00"}
    </button>
  );
}
