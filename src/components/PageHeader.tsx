import { ReactNode } from "react";

/**
 * Cabeçalho padrão de todas as páginas internas: título + subtítulo à
 * esquerda (mesmo espaçamento do Dashboard, incluindo o `pl-5`) e o
 * filtro/ação da página (seletor de mês, período, botão...) à direita.
 */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pl-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
