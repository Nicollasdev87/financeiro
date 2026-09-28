-- ============================================================
-- PATCH — rode este arquivo inteiro no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez (idempotente).
--
-- O que ele faz:
--   1) Código de usuário (#A62-087) único para cada perfil + avatar_url.
--   2) Convites para participar de um planejamento (por código ou por
--      link de cadastro), com aceitar/recusar pelo convidado.
--   3) Regras: 1 planejamento por perfil e no máximo 4 pessoas por
--      planejamento.
--   4) Fecha brechas de segurança em household_members (ninguém pode
--      colocar outra pessoa num planejamento sem passar por convite).
--   5) Bucket "avatars" (Storage) para a foto de perfil.
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
