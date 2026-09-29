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
  created_at timestamptz not null default now(),
  -- meta mensal de gasto no cartão (usada pelo card "Reduzir o cartão" em Evolução)
  credit_card_goal numeric(12,2)
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
  kind text not null check (kind in ('income', 'expense', 'investment')),
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
-- MONTHLY INVESTMENTS (mesmo formato de monthly_income, para
-- categorias do tipo "investment": ações, fundos imobiliários etc.)
-- ------------------------------------------------------------
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
create index if not exists idx_investments_household_month on monthly_investments(household_id, month);
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
alter table monthly_investments enable row level security;
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

create policy "investments_all" on monthly_investments
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

drop trigger if exists trg_investments_updated on monthly_investments;
create trigger trg_investments_updated before update on monthly_investments
  for each row execute procedure set_updated_at();

drop trigger if exists trg_category_notes_updated on monthly_category_notes;
create trigger trg_category_notes_updated before update on monthly_category_notes
  for each row execute procedure set_updated_at();


-- ============================================================
-- CÓDIGO DE USUÁRIO + CONVITES + AVATARES
-- (mesmo conteúdo de migration_patch_2026_09_28.sql — idempotente)
-- ============================================================

-- ------------------------------------------------------------
-- 1) PROFILES: código de usuário + avatar
-- ------------------------------------------------------------
alter table profiles add column if not exists user_code text;
alter table profiles add column if not exists avatar_url text;

-- ------------------------------------------------------------
-- 2) TABELA DE CONVITES
--   - convite por código:  invited_profile_id preenchido
--   - convite por link:    reserved_code preenchido (código que a pessoa
--     vai "herdar" ao se cadastrar pelo link); invited_profile_id fica
--     nulo até o cadastro acontecer.
--   - member_id (opcional): vincula o convidado a uma pessoa que já existe
--     no planejamento sem login (preserva o histórico de lançamentos).
-- ------------------------------------------------------------
create table if not exists household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  invited_by uuid not null references profiles(id) on delete cascade,
  invited_profile_id uuid references profiles(id) on delete cascade,
  reserved_code text,
  member_id uuid references household_members(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists household_invitations_reserved_code_uidx
  on household_invitations (reserved_code) where reserved_code is not null;

-- só um convite pendente por pessoa em cada planejamento
create unique index if not exists household_invitations_pending_uidx
  on household_invitations (household_id, invited_profile_id)
  where status = 'pending' and invited_profile_id is not null;

create index if not exists idx_invitations_invited
  on household_invitations (invited_profile_id) where status = 'pending';

alter table household_invitations enable row level security;

-- leitura: quem foi convidado ou quem faz parte do planejamento.
-- Escrita: só pelas funções abaixo (security definer) — sem policy de
-- insert/update/delete de propósito.
drop policy if exists "invitations_select" on household_invitations;
create policy "invitations_select" on household_invitations
  for select using (
    invited_profile_id = auth.uid()
    or household_id in (select my_household_ids())
  );

-- ------------------------------------------------------------
-- 3) FUNÇÕES DE CÓDIGO
-- ------------------------------------------------------------
-- "a62087", "#a62-087", "A62 087" -> "#A62-087" (ou nulo se inválido)
create or replace function normalize_user_code(p text)
returns text
language sql
immutable
as $$
  select case
    when length(regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g')) = 6 then
      '#' || substr(regexp_replace(upper(p), '[^A-Z0-9]', '', 'g'), 1, 3)
          || '-' || substr(regexp_replace(upper(p), '[^A-Z0-9]', '', 'g'), 4, 3)
    else null
  end;
$$;

-- Gera um código aleatório único, ex: #A62-087
create or replace function generate_user_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  raw text;
  candidate text;
  i int;
begin
  loop
    raw := '';
    for i in 1..6 loop
      raw := raw || substr(
        chars,
        1 + (get_byte(decode(substr(replace(gen_random_uuid()::text, '-', ''), 1, 2), 'hex'), 0) % 36),
        1
      );
    end loop;
    candidate := '#' || substr(raw, 1, 3) || '-' || substr(raw, 4, 3);

    exit when not exists (select 1 from profiles where user_code = candidate)
          and not exists (select 1 from household_invitations where reserved_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Preenche o código dos perfis que já existem
do $$
declare r record;
begin
  for r in select id from profiles where user_code is null loop
    update profiles set user_code = generate_user_code() where id = r.id;
  end loop;
end $$;

alter table profiles alter column user_code set not null;
create unique index if not exists profiles_user_code_uidx on profiles (user_code);

-- O código nunca muda depois de criado
create or replace function guard_profile_code()
returns trigger
language plpgsql
as $$
begin
  if new.user_code is distinct from old.user_code then
    raise exception 'O código de usuário não pode ser alterado.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_code_guard on profiles;
create trigger trg_profile_code_guard before update on profiles
  for each row execute procedure guard_profile_code();

-- ------------------------------------------------------------
-- 4) SIGNUP: cria o profile com código (ou herda o do link de convite)
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite text := normalize_user_code(new.raw_user_meta_data->>'invite_code');
  v_inv_id uuid;
  v_code text;
begin
  if v_invite is not null then
    select id into v_inv_id
    from household_invitations
    where reserved_code = v_invite
      and status = 'pending'
      and invited_profile_id is null
      and (expires_at is null or expires_at > now())
    for update;
  end if;

  v_code := case when v_inv_id is not null then v_invite else generate_user_code() end;

  insert into profiles (id, full_name, user_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_code
  );

  if v_inv_id is not null then
    update household_invitations set invited_profile_id = new.id where id = v_inv_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- 5) REGRAS DO PLANEJAMENTO (household_members)
-- ------------------------------------------------------------
-- 1 planejamento por perfil (trava no banco). Se já houver dado duplicado
-- antigo, só avisa em vez de quebrar o patch inteiro.
do $$
begin
  create unique index if not exists household_members_profile_uidx
    on household_members (profile_id) where profile_id is not null;
exception when others then
  raise notice 'Não foi possível criar o índice de 1 planejamento por perfil (há perfis em mais de um planejamento?): %', sqlerrm;
end $$;

-- máximo de 4 pessoas por planejamento
create or replace function enforce_household_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from household_members where household_id = new.household_id) >= 4 then
    raise exception 'Um planejamento pode ter no máximo 4 pessoas.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_household_members_limit on household_members;
create trigger trg_household_members_limit before insert on household_members
  for each row execute procedure enforce_household_limit();

-- profile_id de um integrante só muda pelas funções de convite
create or replace function guard_member_profile_change()
returns trigger
language plpgsql
as $$
begin
  if new.profile_id is distinct from old.profile_id
     and coalesce(current_setting('app.allow_member_link', true), '') <> 'on' then
    raise exception 'Vincular uma pessoa a um planejamento só é possível através de um convite.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_member_profile_guard on household_members;
create trigger trg_member_profile_guard before update on household_members
  for each row execute procedure guard_member_profile_change();

create or replace function is_household_creator(p_household uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from households where id = p_household and created_by = auth.uid());
$$;

-- Antes: qualquer membro podia inserir um integrante com o profile_id de
-- QUALQUER pessoa (dando acesso sem consentimento), e qualquer um podia se
-- inserir em qualquer planejamento. Agora:
--   - integrante sem login: só dentro do próprio planejamento;
--   - integrante com login: só a própria pessoa, e só no planejamento que
--     ela mesma criou. Entrar em planejamento alheio = convite.
drop policy if exists "members_insert" on household_members;
create policy "members_insert" on household_members
  for insert with check (
    (profile_id is null and household_id in (select my_household_ids()))
    or (profile_id = auth.uid() and is_household_creator(household_id))
  );

-- ------------------------------------------------------------
-- 6) FUNÇÕES DE CONVITE (todas security definer)
-- ------------------------------------------------------------
-- Planejamento "descartável": só uma pessoa e nenhum lançamento.
create or replace function is_discardable_household(p_household uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    (select count(*) from household_members where household_id = p_household) <= 1
    and not exists (select 1 from monthly_expenses where household_id = p_household)
    and not exists (select 1 from monthly_income where household_id = p_household)
    and not exists (select 1 from monthly_investments where household_id = p_household);
$$;

-- Valida vaga (limite de 4) e o vínculo opcional com uma pessoa existente.
create or replace function assert_invite_allowed(p_household uuid, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
begin
  if p_member_id is not null then
    if not exists (
      select 1 from household_members
      where id = p_member_id and household_id = p_household and profile_id is null
    ) then
      raise exception 'A pessoa escolhida para vincular não existe ou já tem login.';
    end if;
    if exists (
      select 1 from household_invitations
      where member_id = p_member_id and status = 'pending'
        and (expires_at is null or expires_at > now())
    ) then
      raise exception 'Já existe um convite pendente para essa pessoa.';
    end if;
    return; -- vincular a alguém que já existe não ocupa vaga nova
  end if;

  select
    (select count(*) from household_members where household_id = p_household)
    + (select count(*) from household_invitations
        where household_id = p_household and status = 'pending'
          and member_id is null
          and (expires_at is null or expires_at > now()))
  into v_used;

  if v_used >= 4 then
    raise exception 'O planejamento já atingiu o limite de 4 pessoas (contando convites pendentes).';
  end if;
end;
$$;

-- Convida alguém pelo código de usuário. Retorna um rótulo do convidado
-- (primeiro nome + inicial) para o remetente conferir se digitou certo.
create or replace function create_invitation_by_code(p_code text, p_member_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_code text := normalize_user_code(p_code);
  v_target uuid;
  v_name text;
  v_target_household uuid;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  if v_code is null then
    raise exception 'Código inválido. Use o formato #A62-087.';
  end if;

  select household_id into v_household from household_members where profile_id = v_uid limit 1;
  if v_household is null then
    raise exception 'Crie o seu planejamento antes de convidar alguém.';
  end if;

  select id, full_name into v_target, v_name from profiles where user_code = v_code;
  if v_target is null then
    raise exception 'Nenhum usuário encontrado com esse código.';
  end if;
  if v_target = v_uid then
    raise exception 'Você não pode convidar a si mesmo.';
  end if;

  select household_id into v_target_household from household_members where profile_id = v_target limit 1;
  if v_target_household = v_household then
    raise exception 'Essa pessoa já participa do seu planejamento.';
  end if;
  if v_target_household is not null and not is_discardable_household(v_target_household) then
    raise exception 'Essa pessoa já participa de outro planejamento.';
  end if;

  perform assert_invite_allowed(v_household, p_member_id);

  begin
    insert into household_invitations (household_id, invited_by, invited_profile_id, member_id)
    values (v_household, v_uid, v_target, p_member_id);
  exception when unique_violation then
    raise exception 'Já existe um convite pendente para essa pessoa.';
  end;

  return concat_ws(' ',
    split_part(v_name, ' ', 1),
    case when split_part(v_name, ' ', 2) <> '' then left(split_part(v_name, ' ', 2), 1) || '.' end
  );
end;
$$;

-- Gera um link de cadastro: reserva um código que a pessoa vai herdar ao
-- criar a conta pelo link. Vale por 7 dias.
create or replace function create_invite_link(p_member_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_code text;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;

  select household_id into v_household from household_members where profile_id = v_uid limit 1;
  if v_household is null then
    raise exception 'Crie o seu planejamento antes de convidar alguém.';
  end if;

  perform assert_invite_allowed(v_household, p_member_id);

  v_code := generate_user_code();
  insert into household_invitations (household_id, invited_by, reserved_code, member_id, expires_at)
  values (v_household, v_uid, v_code, p_member_id, now() + interval '7 days');

  return v_code;
end;
$$;

-- Convites pendentes RECEBIDOS pelo usuário logado (card do dashboard)
create or replace function my_pending_invitations()
returns table (id uuid, inviter_name text, household_name text, created_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select i.id, p.full_name, h.name, i.created_at
  from household_invitations i
  join profiles p on p.id = i.invited_by
  join households h on h.id = i.household_id
  where i.invited_profile_id = auth.uid()
    and i.status = 'pending'
    and (i.expires_at is null or i.expires_at > now())
  order by i.created_at desc;
$$;

-- Convites pendentes ENVIADOS pelo planejamento do usuário logado
create or replace function my_household_invitations()
returns table (
  id uuid,
  invitee_label text,
  code text,
  is_link boolean,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    i.id,
    case
      when i.invited_profile_id is null then 'Link de convite (aguardando cadastro)'
      else concat_ws(' ',
        split_part(p.full_name, ' ', 1),
        case when split_part(p.full_name, ' ', 2) <> '' then left(split_part(p.full_name, ' ', 2), 1) || '.' end
      )
    end,
    coalesce(p.user_code, i.reserved_code),
    (i.reserved_code is not null and i.invited_profile_id is null),
    i.created_at,
    i.expires_at
  from household_invitations i
  left join profiles p on p.id = i.invited_profile_id
  where i.household_id in (select my_household_ids())
    and i.status = 'pending'
    and (i.expires_at is null or i.expires_at > now())
  order by i.created_at desc;
$$;

create or replace function cancel_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update household_invitations
  set status = 'cancelled', responded_at = now()
  where id = p_invitation_id
    and status = 'pending'
    and household_id in (select my_household_ids());
end;
$$;

-- Aceitar / recusar (só o convidado)
create or replace function respond_to_invitation(p_invitation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv household_invitations%rowtype;
  v_old_household uuid;
  v_count int;
  v_name text;
  v_colors text[] := array['#2878F8', '#3F67BF', '#33B669', '#EED146'];
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;

  select * into v_inv from household_invitations where id = p_invitation_id for update;
  if not found or v_inv.invited_profile_id is distinct from v_uid or v_inv.status <> 'pending' then
    raise exception 'Convite não encontrado ou já respondido.';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    update household_invitations set status = 'cancelled', responded_at = now() where id = v_inv.id;
    raise exception 'Este convite expirou.';
  end if;

  if not p_accept then
    update household_invitations set status = 'declined', responded_at = now() where id = v_inv.id;
    return;
  end if;

  -- 1 planejamento por perfil: um planejamento vazio e só seu é descartado
  select household_id into v_old_household from household_members where profile_id = v_uid limit 1;
  if v_old_household is not null then
    if v_old_household = v_inv.household_id then
      raise exception 'Você já participa deste planejamento.';
    elsif is_discardable_household(v_old_household) then
      delete from households where id = v_old_household;
    else
      raise exception 'Você já participa de outro planejamento.';
    end if;
  end if;

  select full_name into v_name from profiles where id = v_uid;

  if v_inv.member_id is not null and exists (
    select 1 from household_members
    where id = v_inv.member_id and household_id = v_inv.household_id and profile_id is null
  ) then
    perform set_config('app.allow_member_link', 'on', true);
    update household_members set profile_id = v_uid where id = v_inv.member_id;
  else
    select count(*) into v_count from household_members where household_id = v_inv.household_id;
    if v_count >= 4 then
      raise exception 'Este planejamento já atingiu o limite de 4 pessoas.';
    end if;
    insert into household_members (household_id, profile_id, display_name, color)
    values (v_inv.household_id, v_uid, v_name, v_colors[(v_count % 4) + 1]);
  end if;

  update household_invitations set status = 'accepted', responded_at = now() where id = v_inv.id;
  update household_invitations
  set status = 'cancelled', responded_at = now()
  where invited_profile_id = v_uid and status = 'pending' and id <> v_inv.id;
end;
$$;

-- ------------------------------------------------------------
-- 7) STORAGE: bucket público "avatars" (cada um só grava na própria pasta)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Recarrega o cache de schema do PostgREST (evita "função/coluna não
-- encontrada" logo após rodar este patch).
notify pgrst, 'reload schema';
