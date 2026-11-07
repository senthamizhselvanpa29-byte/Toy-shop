-- Toy Shop · Milestone 8: shop settings, orders and payments.
-- Run once in Supabase → SQL Editor, after 0004_accounts.sql. Safe to run again.
--
-- Orders are only ever created and changed by the website's server (using the
-- secret key), so prices, stock and payment status can't be faked from a browser.
-- Customers can read their own orders; the owner can read and update all.

-- ---------------------------------------------------------------------------
-- 1. Shop settings (one row): delivery charges and cash on delivery
-- ---------------------------------------------------------------------------
create table if not exists public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  delivery_fee_paise integer not null default 4900 check (delivery_fee_paise >= 0),
  free_delivery_above_paise integer not null default 49900 check (free_delivery_above_paise >= 0),
  cod_enabled boolean not null default true,
  cod_max_paise integer not null default 500000 check (cod_max_paise >= 0),
  updated_at timestamptz not null default now()
);

alter table public.shop_settings enable row level security;
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists shop_settings_set_updated_at on public.shop_settings;
create trigger shop_settings_set_updated_at
  before update on public.shop_settings
  for each row execute function public.set_updated_at();

drop policy if exists "Anyone can read shop settings" on public.shop_settings;
create policy "Anyone can read shop settings"
  on public.shop_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Owner updates shop settings" on public.shop_settings;
create policy "Owner updates shop settings"
  on public.shop_settings for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- ---------------------------------------------------------------------------
-- 2. Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('TS' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  user_id uuid not null references auth.users (id) on delete restrict,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'placed', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('razorpay', 'cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_paise integer not null default 0 check (delivery_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  -- Delivery address, copied at order time so later edits don't change it.
  ship_name text not null,
  ship_phone text not null,
  ship_line1 text not null,
  ship_line2 text not null default '',
  ship_landmark text not null default '',
  ship_city text not null,
  ship_state text not null,
  ship_pincode text not null,
  contact_email text not null default '',
  -- True if a toy sold out between checkout and payment; the owner follows up.
  stock_short boolean not null default false,
  stock_confirmed boolean not null default false,
  placed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Copies of the toy's details at order time.
  name text not null,
  slug text not null default '',
  image_path text not null default '',
  unit_price_paise integer not null check (unit_price_paise >= 0),
  mrp_paise integer,
  gst_rate smallint not null default 12,
  quantity integer not null check (quantity between 1 and 20),
  line_total_paise integer not null check (line_total_paise >= 0)
);

alter table public.order_items enable row level security;

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- 3. Access rules
-- ---------------------------------------------------------------------------
drop policy if exists "Customers read their own orders" on public.orders;
create policy "Customers read their own orders"
  on public.orders for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner()));

drop policy if exists "Owner updates orders" on public.orders;
create policy "Owner updates orders"
  on public.orders for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Customers read their own order items" on public.order_items;
create policy "Customers read their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id)
  );

-- No insert/delete rules: only the server (secret key) creates orders.
revoke insert, delete on public.orders, public.order_items from anon, authenticated;
revoke update on public.orders from anon;
revoke all on public.order_items from anon;

-- ---------------------------------------------------------------------------
-- 4. confirm_order_stock(): take the ordered toys out of stock, once.
--    Called by the server when a cash-on-delivery order is placed or an
--    online payment succeeds. If a toy has sold out meanwhile, the order is
--    flagged (stock_short) for the owner instead of failing a paid order.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  short boolean := false;
  available integer;
begin
  -- Lock the order so two confirmations can't both run.
  perform 1 from public.orders where id = p_order_id and not stock_confirmed for update;
  if not found then
    return false;
  end if;

  for item in
    select product_id, quantity from public.order_items
    where order_id = p_order_id and product_id is not null
  loop
    select stock into available from public.products where id = item.product_id for update;
    if available is null or available < item.quantity then
      short := true;
    end if;
    update public.products
      set stock = greatest(stock - item.quantity, 0)
      where id = item.product_id;
  end loop;

  update public.orders
    set stock_confirmed = true, stock_short = short
    where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.confirm_order_stock(uuid) from public, anon, authenticated;
do $$
begin
  grant execute on function public.confirm_order_stock(uuid) to service_role;
exception when undefined_object then
  null; -- only exists on Supabase
end;
$$;
