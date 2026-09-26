-- ============================================================
-- ORGANIZADOR FINANCEIRO — SCHEMA + RLS
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- ============================================================

-- extensões
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES (espelha auth.users)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HOUSEHOLDS
-- ------------------------------------------------------------
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Minha Família',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- profile_id fica nulo para uma "segunda pessoa" que não tem login próprio
-- (o MVP não implementa convite por e-mail; a pessoa titular cadastra o
-- parceiro apenas como um perfil de lançamento dentro da mesma household).
create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  display_name text not null,
  color text not null default '#7C5CFC',
  created_at timestamptz not null default now()
);

-- helper: households do usuário logado (evita recursão nas policies)
create or replace function my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id from household_members where profile_id = auth.uid();
$$;

-- ------------------------------------------------------------
-- CATEGORIES (receita ou despesa)
-- ------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  nature text not null default 'variable' check (nature in ('fixed', 'variable')),
  icon text not null default 'circle',
  color text not null default '#7C5CFC',
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CREDIT CARDS
-- ------------------------------------------------------------
create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  bank text,
  credit_limit numeric(12,2) not null default 0,
  monthly_goal numeric(12,2) not null default 0,
  closing_day int not null default 1 check (closing_day between 1 and 31),
  due_day int not null default 10 check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MONTHLY EXPENSES (uma linha = household + mês + categoria + pessoa)
-- ------------------------------------------------------------
create table if not exists monthly_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null, -- sempre dia 1 do mês, ex: 2026-09-01
  category_id uuid not null references categories(id) on delete cascade,
  member_id uuid references household_members(id) on delete set null,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, month, category_id, member_id)
);

-- ------------------------------------------------------------
-- MONTHLY EXPENSE PAYMENTS (divisão por forma de pagamento)
-- ------------------------------------------------------------
create table if not exists monthly_expense_payments (
  id uuid primary key default gen_random_uuid(),
  monthly_expense_id uuid not null references monthly_expenses(id) on delete cascade,
  method text not null check (method in ('pix', 'credit', 'debit', 'cash', 'boleto', 'other')),
  credit_card_id uuid references credit_cards(id) on delete set null,
  amount numeric(12,2) not null default 0,
  unique (monthly_expense_id, method, credit_card_id)
);

-- trava extra: garante unicidade também quando credit_card_id é nulo
-- (unique constraints padrão do Postgres tratam cada NULL como distinto)
create unique index if not exists monthly_expense_payments_null_card_uidx
  on monthly_expense_payments (monthly_expense_id, method)
  where credit_card_id is null;

-- ------------------------------------------------------------
-- MONTHLY INCOME
-- ------------------------------------------------------------
create table if not exists monthly_income (
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

-- ------------------------------------------------------------
-- MONTHLY CATEGORY NOTES (observações livres por categoria/mês)
-- ------------------------------------------------------------
create table if not exists monthly_category_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month date not null,
  category_id uuid not null references categories(id) on delete cascade,
  notes text,
  updated_at timestamptz not null default now(),
  unique (household_id, month, category_id)
);

-- ------------------------------------------------------------
-- FINANCIAL GOALS (metas do cartão, por enquanto)
-- ------------------------------------------------------------
create table if not exists financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  credit_card_id uuid references credit_cards(id) on delete cascade,
  month date not null,
  target_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, credit_card_id, month)
);

-- índices
create index if not exists idx_expenses_household_month on monthly_expenses(household_id, month);
create index if not exists idx_income_household_month on monthly_income(household_id, month);
create index if not exists idx_payments_expense on monthly_expense_payments(monthly_expense_id);
create index if not exists idx_categories_household on categories(household_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table credit_cards enable row level security;
alter table monthly_expenses enable row level security;
alter table monthly_expense_payments enable row level security;
alter table monthly_income enable row level security;
alter table monthly_category_notes enable row level security;
alter table financial_goals enable row level security;

-- profiles: cada um vê/edita o próprio
create policy "profiles_self" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- households: membro pode ver; quem cria pode inserir
create policy "households_select" on households
  for select using (id in (select my_household_ids()));
create policy "households_insert" on households
  for insert with check (created_by = auth.uid());
create policy "households_update" on households
  for update using (id in (select my_household_ids()));

-- household_members: membros da mesma household enxergam uns aos outros
create policy "members_select" on household_members
  for select using (household_id in (select my_household_ids()));
create policy "members_insert" on household_members
  for insert with check (
    household_id in (select my_household_ids())
    or profile_id = auth.uid()
  );
create policy "members_update" on household_members
  for update using (household_id in (select my_household_ids()));
create policy "members_delete" on household_members
  for delete using (household_id in (select my_household_ids()));

-- tabelas simples "household-scoped": mesma regra para select/insert/update/delete
create policy "categories_all" on categories
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

create policy "cards_all" on credit_cards
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

create policy "expenses_all" on monthly_expenses
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

create policy "income_all" on monthly_income
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

create policy "category_notes_all" on monthly_category_notes
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

create policy "goals_all" on financial_goals
  for all using (household_id in (select my_household_ids()))
  with check (household_id in (select my_household_ids()));

-- payments: valida via join na monthly_expenses
create policy "payments_all" on monthly_expense_payments
  for all using (
    monthly_expense_id in (
      select id from monthly_expenses where household_id in (select my_household_ids())
    )
  )
  with check (
    monthly_expense_id in (
      select id from monthly_expenses where household_id in (select my_household_ids())
    )
  );

-- ------------------------------------------------------------
-- TRIGGER: cria profile automaticamente no signup
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_updated on monthly_expenses;
create trigger trg_expenses_updated before update on monthly_expenses
  for each row execute procedure set_updated_at();

drop trigger if exists trg_income_updated on monthly_income;
create trigger trg_income_updated before update on monthly_income
  for each row execute procedure set_updated_at();

drop trigger if exists trg_category_notes_updated on monthly_category_notes;
create trigger trg_category_notes_updated before update on monthly_category_notes
  for each row execute procedure set_updated_at();
