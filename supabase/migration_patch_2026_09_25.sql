-- ============================================================
-- PATCH — rode este arquivo inteiro no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez (idempotente).
--
-- O que ele faz:
--   1) Adiciona a coluna "description" em categories.
--   2) Cria a tabela monthly_category_notes (campo "Observações").
--   3) CORRIGE OS DADOS já duplicados pelo bug de "valor somando
--      sozinho" (ex: 400 -> editar para 450 -> mostrava 850).
--   4) Cria um índice único parcial como trava extra de segurança
--      para o caso de credit_card_id nulo (pix, débito, dinheiro...).
-- ============================================================

-- 1) Descrição da categoria
alter table categories add column if not exists description text;

-- 2) Observações por categoria + mês
create table if not exists monthly_category_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  category_id uuid not null references categories(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  unique (household_id, month, category_id)
);

alter table monthly_category_notes enable row level security;

drop policy if exists "category_notes_all" on monthly_category_notes;
create policy "category_notes_all" on monthly_category_notes
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

drop trigger if exists trg_category_notes_updated on monthly_category_notes;
create trigger trg_category_notes_updated before update on monthly_category_notes
  for each row execute procedure set_updated_at();

-- 3) CORREÇÃO DO BUG: mescla linhas duplicadas de monthly_expense_payments
--    (mesma monthly_expense_id + method + credit_card_id, geralmente com
--    credit_card_id nulo) somando os valores em uma única linha e
--    apagando as demais.
with dups as (
  select
    monthly_expense_id,
    method,
    credit_card_id,
    min(id) as keep_id,
    sum(amount) as total_amount
  from monthly_expense_payments
  group by monthly_expense_id, method, credit_card_id
  having count(*) > 1
)
update monthly_expense_payments p
set amount = d.total_amount
from dups d
where p.id = d.keep_id;

with dups as (
  select
    monthly_expense_id,
    method,
    credit_card_id,
    min(id) as keep_id
  from monthly_expense_payments
  group by monthly_expense_id, method, credit_card_id
  having count(*) > 1
)
delete from monthly_expense_payments p
using dups d
where p.monthly_expense_id = d.monthly_expense_id
  and p.method = d.method
  and (p.credit_card_id = d.credit_card_id or (p.credit_card_id is null and d.credit_card_id is null))
  and p.id <> d.keep_id;

-- Recalcula o total de cada lançamento após a mesclagem acima
update monthly_expenses me
set total = coalesce((
  select sum(amount) from monthly_expense_payments p where p.monthly_expense_id = me.id
), 0);

-- 4) Índice único parcial: garante, no banco, que não volte a existir mais
-- de uma linha de pagamento sem cartão para o mesmo lançamento+método.
-- (O app já foi corrigido para não depender mais do ON CONFLICT nesse
-- caso, mas este índice é uma trava extra de segurança.)
create unique index if not exists monthly_expense_payments_null_card_uidx
  on monthly_expense_payments (monthly_expense_id, method)
  where credit_card_id is null;
