import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rotas que só fazem sentido para quem NÃO está logado — usuário logado
  // que cair aqui é mandado pro dashboard.
  const publicOnlyRoutes = ["/login", "/cadastro", "/recuperar-senha"];
  const isPublicOnly = publicOnlyRoutes.some((r) => path.startsWith(r));

  // Rotas que nunca forçam redirecionamento em nenhuma direção:
  // - /auth/callback: troca o code da Supabase por sessão (roda sem sessão ainda).
  // - /redefinir-senha: alcançada só depois do callback, quando o usuário já
  //   está "logado" (sessão de recuperação) — bloquear isso quebraria o fluxo.
  const isBypassed = path.startsWith("/auth") || path.startsWith("/redefinir-senha");

  if (!isBypassed) {
    if (!user && !isPublicOnly) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && isPublicOnly) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
