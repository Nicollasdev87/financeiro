-- ============================================================
-- PATCH — rode este arquivo inteiro no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez (idempotente).
--
-- O que ele faz:
--   1) Permite o novo kind "investment" na tabela categories
--      (além de "income"/"expense"), para categorias como
--      Ações, Fundos Imobiliários, Renda Fixa etc.
--   2) Cria a tabela monthly_investments (mesmo formato de
--      monthly_income: household + mês + categoria + pessoa).
--   3) RLS, índice e trigger de updated_at para a tabela nova.
-- ============================================================

-- 1) Libera o novo kind na constraint de categories
alter table categories drop constraint if exists categories_kind_check;
alter table categories add constraint categories_kind_check
  check (kind in ('income', 'expense', 'investment'));

-- 2) Tabela de lançamentos mensais de investimento
create table if not exists monthly_investments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  category_id uuid not null references categories(id) on delete cascade,
  member_id uuid references household_members(id) on delete set null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, month, category_id, member_id)
);

create index if not exists idx_investments_household_month
  on monthly_investments(household_id, month);

alter table monthly_investments enable row level security;

drop policy if exists "investments_all" on monthly_investments;
create policy "investments_all" on monthly_investments
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

drop trigger if exists trg_investments_updated on monthly_investments;
create trigger trg_investments_updated before update on monthly_investments
  for each row execute procedure set_updated_at();

-- Recarrega o cache de schema do PostgREST (evita erro "coluna/tabela
-- não encontrada" na API logo após rodar este patch).
notify pgrst, 'reload schema';
