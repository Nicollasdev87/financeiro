"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { copyToClipboard } from "@/lib/userCode";

export function UserCodeCard() {
  const { userCode, loading } = useCurrentUser();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!userCode) return;
    if (await copyToClipboard(userCode)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <Card>
      <h3 className="font-medium">Seu código de usuário</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Passe este código para quem quer te convidar para um planejamento. Ele é único e não muda.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-control border border-border bg-surface-secondary px-4 py-2 font-mono text-xl font-semibold tracking-wider">
          {loading ? "..." : userCode ?? "—"}
        </span>
        <Button size="sm" variant="secondary" onClick={handleCopy} disabled={!userCode}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      {!loading && !userCode && (
        <p className="mt-3 text-sm text-warning">
          Código indisponível. Rode o patch <code>migration_patch_2026_09_28.sql</code> no Supabase.
        </p>
      )}
    </Card>
  );
}
