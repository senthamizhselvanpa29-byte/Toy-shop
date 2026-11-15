-- Toy Shop · Step 3: the owner's own shop name, logo, contact details, banner,
-- holiday mode, invoice settings and policy pages.
-- Run once in Supabase → SQL Editor, after 0007_translations.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- 1. Shop identity and contact (all editable in Owner area → Settings)
-- ---------------------------------------------------------------------------
alter table public.shop_settings
  -- Name for invoices if it differs from the shop name (e.g. the GST-registered name).
  add column if not exists legal_name text not null default '',
  add column if not exists tagline text not null default '',
  add column if not exists logo_path text not null default '',
  add column if not exists logo_emoji text not null default '🧸',
  add column if not exists show_name_with_logo boolean not null default true,
  add column if not exists whatsapp_enabled boolean not null default false,
  add column if not exists whatsapp_number text not null default '',
  add column if not exists whatsapp_message text not null default '',
  add column if not exists instagram_url text not null default '',
  add column if not exists facebook_url text not null default '',
  add column if not exists youtube_url text not null default '',
  add column if not exists grievance_officer text not null default '',
  -- Banner at the top of every shop page.
  add column if not exists announcement_enabled boolean not null default false,
  add column if not exists announcement_text text not null default '',
  add column if not exists announcement_link text not null default '',
  add column if not exists announcement_color text not null default 'sunshine'
    check (announcement_color in ('sunshine', 'sky', 'bubblegum', 'mint', 'orange', 'grape')),
  -- Holiday mode: shoppers can browse, but can't place new orders.
  add column if not exists ordering_paused boolean not null default false,
  add column if not exists paused_message text not null default '',
  -- Invoices.
  add column if not exists gst_mode text not null default 'none'
    check (gst_mode in ('none', 'regular', 'composition')),
  add column if not exists invoice_prefix text not null default 'INV'
    check (invoice_prefix ~ '^[A-Z0-9]{1,6}$'),
  add column if not exists invoice_fy boolean not null default true,
  add column if not exists invoice_notes text not null default '',
  add column if not exists signature_path text not null default '',
  add column if not exists signatory_name text not null default '',
  -- Tamil and Hindi versions of the tagline, banner and holiday message:
  --   { "ta": { "tagline": "…", "announcement": "…", "pausedMessage": "…", "whatsappMessage": "…" }, "hi": { … } }
  add column if not exists translations jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shop_settings_translations_is_object') then
    alter table public.shop_settings
      add constraint shop_settings_translations_is_object check (jsonb_typeof(translations) = 'object');
  end if;
end $$;

-- Shops that already entered a GSTIN keep getting GST tax invoices.
update public.shop_settings set gst_mode = 'regular' where gstin <> '' and gst_mode = 'none';

-- ---------------------------------------------------------------------------
-- 2. Invoice numbers: INV/26-27/0001, INV/26-27/0002, … one series per
--    financial year (April–March, India time). Given once, when an order is
--    placed, and never changed afterwards.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists invoice_number text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_invoice_number_key') then
    alter table public.orders add constraint orders_invoice_number_key unique (invoice_number);
  end if;
end $$;

create table if not exists public.invoice_counters (
  series text primary key,
  last_number integer not null default 0 check (last_number >= 0)
);
alter table public.invoice_counters enable row level security;

drop policy if exists "Owner reads invoice counters" on public.invoice_counters;
create policy "Owner reads invoice counters"
  on public.invoice_counters for select
  to authenticated
  using ((select public.is_owner()));

-- The start of a series, e.g. 'INV/26-27/' (or 'INV/' without the year).
create or replace function public.invoice_series(p_at timestamptz)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.invoice_prefix || '/' ||
    case when s.invoice_fy then
      to_char(f.fy_start, 'YY') || '-' || to_char(f.fy_start + interval '1 year', 'YY') || '/'
    else '' end
  from public.shop_settings s,
    lateral (
      select make_date(
        extract(year from (p_at at time zone 'Asia/Kolkata'))::int
          - case when extract(month from (p_at at time zone 'Asia/Kolkata')) >= 4 then 0 else 1 end,
        4, 1) as fy_start
    ) f
  where s.id = 1
$$;

create or replace function public.next_invoice_number(p_at timestamptz)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series text := coalesce(public.invoice_series(p_at), 'INV/');
  v_number integer;
begin
  insert into public.invoice_counters as c (series, last_number)
  values (v_series, 1)
  on conflict (series) do update set last_number = c.last_number + 1
  returning c.last_number into v_number;
  -- At least 4 digits (0001); bigger numbers are never cut short.
  return v_series || case when v_number >= 1000 then v_number::text else lpad(v_number::text, 4, '0') end;
end;
$$;

create or replace function public.orders_assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.invoice_number is not null then
    new.invoice_number := old.invoice_number;
  elsif new.placed_at is not null then
    new.invoice_number := public.next_invoice_number(new.placed_at);
  else
    new.invoice_number := null;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_assign_invoice_number on public.orders;
create trigger orders_assign_invoice_number
  before insert or update on public.orders
  for each row execute function public.orders_assign_invoice_number();

-- Orders placed before this update get their numbers now, oldest first.
do $$
declare
  r record;
begin
  for r in
    select id from public.orders
    where placed_at is not null and invoice_number is null
    order by placed_at, created_at
  loop
    update public.orders set placed_at = placed_at where id = r.id;
  end loop;
end $$;

-- The owner can choose where numbering continues (e.g. after paper invoices),
-- but never go back to a number that was already used.
create or replace function public.set_next_invoice_number(p_next integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_series text := coalesce(public.invoice_series(now()), 'INV/');
  v_last integer;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can change invoice numbers' using errcode = '42501';
  end if;
  if p_next is null or p_next < 1 or p_next > 999999 then
    raise exception 'Choose a number from 1 to 999999' using errcode = '22023';
  end if;
  select last_number into v_last from public.invoice_counters where series = v_series;
  if p_next <= coalesce(v_last, 0) then
    raise exception 'Invoice number % is already used', p_next using errcode = '23505';
  end if;
  insert into public.invoice_counters as c (series, last_number)
  values (v_series, p_next - 1)
  on conflict (series) do update set last_number = excluded.last_number;
  return v_series;
end;
$$;

-- What the next invoice will be called, for the owner's settings screen.
create or replace function public.next_invoice_preview()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_series text := coalesce(public.invoice_series(now()), 'INV/');
  v_next integer;
begin
  if not public.is_owner() then
    raise exception 'Only the shop owner can see this' using errcode = '42501';
  end if;
  select last_number + 1 into v_next from public.invoice_counters where series = v_series;
  v_next := coalesce(v_next, 1);
  return v_series || case when v_next >= 1000 then v_next::text else lpad(v_next::text, 4, '0') end;
end;
$$;

revoke all on function public.invoice_series(timestamptz) from public, anon, authenticated;
revoke all on function public.next_invoice_number(timestamptz) from public, anon, authenticated;
revoke all on function public.orders_assign_invoice_number() from public, anon, authenticated;
revoke all on function public.set_next_invoice_number(integer) from public, anon;
revoke all on function public.next_invoice_preview() from public, anon;
grant execute on function public.set_next_invoice_number(integer) to authenticated;
grant execute on function public.next_invoice_preview() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policy pages (Contact, Privacy, Terms, Refunds, Shipping). The website
--    has suggested text for each; a row here is the owner's own version.
-- ---------------------------------------------------------------------------
create table if not exists public.shop_pages (
  slug text primary key check (slug in ('contact', 'privacy', 'terms', 'refunds', 'shipping')),
  title text not null default '',
  body text not null default '',
  -- { "ta": { "title": "…", "body": "…" }, "hi": { … } }
  translations jsonb not null default '{}'::jsonb check (jsonb_typeof(translations) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.shop_pages enable row level security;

drop trigger if exists shop_pages_set_updated_at on public.shop_pages;
create trigger shop_pages_set_updated_at
  before update on public.shop_pages
  for each row execute function public.set_updated_at();

drop policy if exists "Anyone can read shop pages" on public.shop_pages;
create policy "Anyone can read shop pages"
  on public.shop_pages for select
  to anon, authenticated
  using (true);

drop policy if exists "Owner adds shop pages" on public.shop_pages;
create policy "Owner adds shop pages"
  on public.shop_pages for insert
  to authenticated
  with check ((select public.is_owner()));

drop policy if exists "Owner updates shop pages" on public.shop_pages;
create policy "Owner updates shop pages"
  on public.shop_pages for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Owner removes shop pages" on public.shop_pages;
create policy "Owner removes shop pages"
  on public.shop_pages for delete
  to authenticated
  using ((select public.is_owner()));
