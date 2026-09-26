# Organizador Financeiro

App web de organização financeira para casal/família: lançamento mensal por
**categoria → forma de pagamento → valor**, sem precisar cadastrar compra por
compra. Next.js + TypeScript + Tailwind + Supabase, pronto para Vercel.

## 1. Instalar

```bash
npm install
```

## 2. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com.
2. Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql` (cria
   tabelas, índices, triggers e as políticas de RLS).
3. (Opcional, para ver dados de exemplo) Crie sua conta pela tela de login do
   app primeiro, pegue seu `id` em **Authentication → Users**, cole no lugar
   de `'SEU_USER_ID'` no topo de `supabase/seed.sql` e rode esse arquivo no
   SQL Editor.

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha com os valores de **Project Settings → API** do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 4. Rodar localmente

```bash
npm run dev
```

Acesse http://localhost:3000 — você será redirecionado para `/login`. Crie
uma conta (email/senha). No primeiro acesso, vá em **Configurações** para
criar sua família e, se quiser, adicionar a segunda pessoa.

## 5. Deploy na Vercel

1. Suba o código para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) em **Project Settings → Environment
   Variables**.
4. Deploy. Não é necessário Docker nem configuração adicional.

## Estrutura

- `supabase/schema.sql` — todas as tabelas, índices, triggers e RLS.
- `supabase/seed.sql` — dados de demonstração (receitas, despesas, cartão).
- `src/app/(app)/...` — telas autenticadas (Dashboard, Meu mês, Cartões,
  Evolução, Categorias, Configurações).
- `src/components/ui/` — design system (Button, Card, CurrencyInput, Modal…).
- `src/lib/hooks/` — busca de dados (household, mês atual, últimos meses).

## Decisões e simplificações do MVP

Para manter o escopo enxuto e funcional, algumas simplificações foram
tomadas conscientemente — dá para evoluir depois sem redesenhar o banco:

- **Segunda pessoa sem login próprio**: por padrão o app não implementa
  convite por e-mail. A segunda pessoa é cadastrada em Configurações como um
  "perfil de lançamento" dentro da mesma família (linha em
  `household_members` com `profile_id` nulo). Se quiser que as duas pessoas
  tenham login separado de fato, dá para estender isso com convite por
  e-mail usando o mesmo `households`/`household_members`.
- **Fatura de cartão agregada**: o "Utilizado" de cada cartão soma todo
  crédito lançado no mês na household (não por cartão individual), como o
  briefing pede ("não é necessário cadastrar cada compra"). Com mais de um
  cartão ativo, seria necessário decidir uma regra de rateio entre eles —
  ficou fora do MVP.
- **Ícones de categoria**: o campo `icon` existe no banco, mas a seleção de
  ícone na interface ficou fora do MVP (todas usam um ponto colorido). Fácil
  de adicionar depois com os ícones do `lucide-react`.
- **Ícones do manifest PWA**: `public/manifest.json` referencia
  `/icons/icon-192.png` e `/icons/icon-512.png` — adicione esses dois
  arquivos de imagem para o "Adicionar à tela inicial" funcionar por
  completo.
- **Onboarding**: reduzido a uma etapa única em Configurações (criar família
  → adicionar pessoa) em vez do fluxo de 6 etapas do briefing original, para
  não atrasar o MVP.
