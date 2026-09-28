/**
 * Código de usuário: `#A62-087` (# + 3 caracteres + - + 3 caracteres,
 * letras maiúsculas e números). Estas funções espelham `normalize_user_code`
 * do banco, para validar/formatar no cliente antes de chamar as funções RPC.
 */

/** "a62087", "#a62-087", "A62 087" -> "#A62-087" (ou null se inválido). */
export function normalizeUserCode(input: string | null | undefined): string | null {
  const raw = (input ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 6) return null;
  return `#${raw.slice(0, 3)}-${raw.slice(3)}`;
}

/** Formata enquanto a pessoa digita: mantém só A-Z/0-9 e aplica # e -. */
export function formatUserCodeInput(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (raw.length === 0) return "";
  if (raw.length <= 3) return `#${raw}`;
  return `#${raw.slice(0, 3)}-${raw.slice(3)}`;
}

/** Link de cadastro que carrega o código reservado (sem # e - para caber na URL). */
export function buildInviteLink(origin: string, code: string): string {
  const raw = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${origin}/cadastro?convite=${raw}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
