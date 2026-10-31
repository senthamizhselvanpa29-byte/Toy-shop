-- Toy Shop · Milestone 7: customer addresses and wishlists.
-- Run once in Supabase → SQL Editor, after 0003_demo_toys.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- 1. Delivery addresses (each customer can save several, one is the default)
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null default 'Home' check (label in ('Home', 'Work', 'Other')),
  full_name text not null check (length(trim(full_name)) between 2 and 80),
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  line1 text not null check (length(trim(line1)) between 3 and 120),
  line2 text not null default '',
  landmark text not null default '',
  city text not null check (length(trim(city)) between 2 and 60),
  state text not null,
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

create index if not exists addresses_user_idx on public.addresses (user_id);
-- At most one default address per customer.
create unique index if not exists addresses_one_default
  on public.addresses (user_id) where is_default;

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

drop policy if exists "Customers manage their own addresses" on public.addresses;
create policy "Customers manage their own addresses"
  on public.addresses for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Owner views all addresses" on public.addresses;
create policy "Owner views all addresses"
  on public.addresses for select
  to authenticated
  using ((select public.is_owner()));

-- ---------------------------------------------------------------------------
-- 2. Wishlists (❤️ saved toys)
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist_items enable row level security;

drop policy if exists "Customers manage their own wishlist" on public.wishlist_items;
create policy "Customers manage their own wishlist"
  on public.wishlist_items for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Profiles: let customers fill in their own phone number on sign-up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.phone is not null and new.phone <> '' then '+' || ltrim(new.phone, '+') end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
