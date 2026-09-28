"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IconInput } from "@/components/ui/IconInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength, isPasswordStrongEnough } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/Button";
import { normalizeUserCode } from "@/lib/userCode";

export default function CadastroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Link de convite: /cadastro?convite=A62087. Lido no cliente (sem
  // useSearchParams) para não exigir <Suspense> no build.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("convite");
    setInviteCode(normalizeUserCode(raw));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!isPasswordStrongEnough(password)) {
      setError("Escolha uma senha mais segura — siga os requisitos abaixo do campo.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // invite_code: o banco herda o código reservado pelo link e cria o convite pendente
      options: { data: { full_name: fullName, ...(inviteCode ? { invite_code: inviteCode } : {}) } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      // Projeto exige confirmação por e-mail antes de criar a sessão.
      setCheckEmail(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">Confirme seu e-mail</h1>
        <p className="text-sm text-text-secondary">
          Enviamos um link de confirmação para <span className="font-medium text-text">{email}</span>. Clique nele
          para ativar sua conta.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Criar sua conta</h1>
        <p className="mt-1 text-sm text-text-secondary">Comece a organizar as finanças em minutos.</p>
      </div>

      {inviteCode && (
        <div className="flex items-start gap-2 rounded-control border border-border bg-primary/10 p-3 text-sm text-text">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            Você está se cadastrando por um link de convite. Depois de entrar, o convite aparece no seu dashboard
            para você aceitar ou recusar.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Nome</label>
          <IconInput
            icon={<User className="h-4 w-4" />}
            placeholder="Seu nome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">E-mail</label>
          <IconInput
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Senha</label>
          <PasswordInput
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
          <PasswordStrength password={password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Confirmar senha</label>
          <PasswordInput
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
