import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recebe o link de recuperação de senha (e outros fluxos com "code") do
 * Supabase, troca o código pela sessão e redireciona para `next`
 * (por padrão, a tela de redefinir senha).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
