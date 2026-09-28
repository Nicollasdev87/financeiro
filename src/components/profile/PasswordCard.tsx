"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength, isPasswordStrongEnough } from "@/components/auth/PasswordStrength";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export function PasswordCard() {
  const supabase = createClient();
  const { email } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  function startEditing() {
    setMessage(null);
    setEditing(true);
  }

  function cancelEditing() {
    reset();
    setMessage(null);
    setEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (next !== confirm) {
      setMessage({ type: "error", text: "As senhas novas não coincidem." });
      return;
    }
    if (!isPasswordStrongEnough(next)) {
      setMessage({ type: "error", text: "Escolha uma senha mais segura — siga os requisitos abaixo do campo." });
      return;
    }
    if (!email) return;

    setSaving(true);
    // Confere a senha atual antes de trocar (protege contra alguém usando o
    // seu computador desbloqueado).
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authError) {
      setSaving(false);
      setMessage({ type: "error", text: "Senha atual incorreta." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    reset();
    setEditing(false);
    setMessage({ type: "ok", text: "Senha alterada com sucesso." });
  }

  // Padrão: só uma linha com o botão. O formulário aparece ao clicar em "Editar senha".
  if (!editing) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Senha</h3>
          {message ? (
            <p className={`text-sm ${message.type === "ok" ? "text-success" : "text-danger"}`}>{message.text}</p>
          ) : (
            <p className="text-sm tracking-widest text-text-secondary">••••••••</p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={startEditing}>
          <Pencil className="h-4 w-4" /> Editar senha
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="font-medium">Editar senha</h3>
      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Senha atual</label>
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Nova senha</label>
          <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
          <PasswordStrength password={next} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Confirmar nova senha</label>
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        </div>

        {message && <p className="text-sm text-danger">{message.text}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar senha"}</Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={cancelEditing}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
