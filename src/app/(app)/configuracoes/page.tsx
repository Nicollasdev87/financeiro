import { redirect } from "next/navigation";

/**
 * Página de configurações antiga DESATIVADA: tudo o que existia aqui
 * (criar planejamento, adicionar pessoa, sair) agora vive em /perfil.
 * Mantemos a rota só para links/favoritos antigos não darem 404.
 */
export default function ConfiguracoesPage() {
  redirect("/perfil");
}
