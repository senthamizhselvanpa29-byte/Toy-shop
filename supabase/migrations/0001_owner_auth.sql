-- Toy Shop · Milestone 3: owner account, profiles and Row Level Security.
-- Run once in Supabase → SQL Editor. Safe to run again.

-- ---------------------------------------------------------------------------
-- 1. Lock every new table in the public schema by default (Row Level Security)
-- ---------------------------------------------------------------------------
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  obj record;
begin
  for obj in
    select * from pg_event_trigger_ddl_commands()
    where object_type = 'table' and schema_name = 'public'
  loop
    execute format('alter table %s enable row level security', obj.object_identity);
  end loop;
end;
$$;

do $$
begin
  drop event trigger if exists rls_auto_enable;
  create event trigger rls_auto_enable
    on ddl_command_end
    when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
    execute function public.rls_auto_enable();
exception when insufficient_privilege then
  -- Supabase's own "Enable automatic RLS" setting already covers this.
  raise notice 'Skipped rls_auto_enable event trigger: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Shared helper: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Profiles: one row per signed-up person, with their role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('owner', 'customer')),
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- There can only ever be one shop owner.
create unique index if not exists profiles_single_owner
  on public.profiles (role) where role = 'owner';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. is_owner(): true when the signed-in person is the shop owner.
--    Used by every "only the owner can change this" rule.
-- ---------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Create a profile automatically whenever someone signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for anyone who signed up before this script ran.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Profile access rules
-- ---------------------------------------------------------------------------
drop policy if exists "Read own profile, owner reads all" on public.profiles;
create policy "Read own profile, owner reads all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_owner()));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- People may edit their name and phone, never their role.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 7. set_shop_owner(): run from the SQL Editor to choose the owner account.
--    Example:  select public.set_shop_owner('you@example.com');
-- ---------------------------------------------------------------------------
create or replace function public.set_shop_owner(owner_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from auth.users
  where lower(email) = lower(trim(owner_email));

  if owner_id is null then
    raise exception 'No user with email %. Add the user in Authentication → Users first.', owner_email;
  end if;

  insert into public.profiles (id) values (owner_id) on conflict (id) do nothing;
  update public.profiles set role = 'customer' where role = 'owner' and id <> owner_id;
  update public.profiles set role = 'owner' where id = owner_id;

  return 'Done! ' || trim(owner_email) || ' is now the shop owner.';
end;
$$;

-- Only callable from the SQL Editor, never from the website.
revoke all on function public.set_shop_owner(text) from public, anon, authenticated;
