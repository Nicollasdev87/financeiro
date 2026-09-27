"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

/** Exige tamanho mínimo + pelo menos mais 2 critérios (maiúscula, número ou especial). */
export function isPasswordStrongEnough(password: string) {
  const c = getPasswordChecks(password);
  const extras = [c.upper, c.number, c.special].filter(Boolean).length;
  return c.length && extras >= 2;
}

const REQUIREMENTS: { key: keyof ReturnType<typeof getPasswordChecks>; label: string }[] = [
  { key: "length", label: "8+ caracteres" },
  { key: "upper", label: "1 letra maiúscula" },
  { key: "number", label: "1 número" },
  { key: "special", label: "1 caractere especial" },
];

/** Barra de força + checklist de requisitos, atualizados a cada tecla. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = getPasswordChecks(password);
  const score = REQUIREMENTS.reduce((s, r) => s + (checks[r.key] ? 1 : 0), 0); // 0-4
  const level = score <= 1 ? "fraca" : score <= 3 ? "média" : "forte";
  const tone = level === "fraca" ? "bg-danger" : level === "média" ? "bg-warning" : "bg-success";
  const textTone = level === "fraca" ? "text-danger" : level === "média" ? "text-warning" : "text-success";
  const width = ["w-0", "w-1/4", "w-2/4", "w-3/4", "w-full"][score];

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
          <div className={cn("h-full rounded-full transition-all duration-300", tone, width)} />
        </div>
        <span className={cn("text-xs font-medium capitalize", textTone)}>{level}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {REQUIREMENTS.map((r) => (
          <span
            key={r.key}
            className={cn("flex items-center gap-1 text-xs", checks[r.key] ? "text-success" : "text-text-tertiary")}
          >
            {checks[r.key] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
