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
--    (usamos row_number() em vez de min(id)/max(id) porque o Postgres
--    não tem uma função de agregação min/max nativa para o tipo uuid)
with ranked as (
  select
    id,
    monthly_expense_id,
    row_number() over (
      partition by monthly_expense_id, method, credit_card_id
      order by id
    ) as rn,
    sum(amount) over (
      partition by monthly_expense_id, method, credit_card_id
    ) as total_amount
  from monthly_expense_payments
)
update monthly_expense_payments p
set amount = r.total_amount
from ranked r
where p.id = r.id and r.rn = 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by monthly_expense_id, method, credit_card_id
      order by id
    ) as rn
  from monthly_expense_payments
)
delete from monthly_expense_payments p
using ranked r
where p.id = r.id and r.rn > 1;

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

-- 5) Recarrega o cache de schema do PostgREST. Sem isso, a API pode
-- continuar "sem enxergar" a coluna "description" recém-criada por um
-- tempo, e o app falha ao salvá-la (esse é o motivo mais comum de uma
-- coluna nova "não salvar" logo após rodar um ALTER TABLE manual).
notify pgrst, 'reload schema';
