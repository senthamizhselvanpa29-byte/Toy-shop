-- Toy Shop · Milestone 9: managing orders, cancellations, returns and invoices.
-- Run once in Supabase → SQL Editor, after 0005_orders.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- 1. Order tracking details
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists packed_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text check (cancelled_by in ('customer', 'owner')),
  add column if not exists cancel_reason text not null default '',
  add column if not exists courier_name text not null default '',
  add column if not exists tracking_number text not null default '',
  add column if not exists tracking_url text not null default '',
  add column if not exists owner_note text not null default '',
  add column if not exists return_status text not null default 'none'
    check (return_status in ('none', 'requested', 'approved', 'rejected', 'returned')),
  add column if not exists return_reason text not null default '',
  add column if not exists return_requested_at timestamptz,
  add column if not exists refund_id text,
  add column if not exists refund_paise integer,
  add column if not exists refunded_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Business details for GST invoices
-- ---------------------------------------------------------------------------
alter table public.shop_settings
  add column if not exists business_name text not null default 'Toy Shop',
  add column if not exists business_address text not null default '',
  add column if not exists business_state text not null default 'Tamil Nadu',
  add column if not exists business_phone text not null default '',
  add column if not exists business_email text not null default '',
  add column if not exists gstin text not null default '',
  add column if not exists default_hsn text not null default '9503',
  add column if not exists return_days integer not null default 7 check (return_days between 0 and 60);

-- ---------------------------------------------------------------------------
-- 3. restore_order_stock(): put a cancelled or returned order's toys back
--    in stock, once. Only the server (secret key) can call it.
-- ---------------------------------------------------------------------------
create or replace function public.restore_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
begin
  perform 1 from public.orders where id = p_order_id and stock_confirmed for update;
  if not found then
    return false;
  end if;

  for item in
    select product_id, quantity from public.order_items
    where order_id = p_order_id and product_id is not null
  loop
    update public.products set stock = stock + item.quantity where id = item.product_id;
  end loop;

  update public.orders set stock_confirmed = false where id = p_order_id;
  return true;
end;
$$;

revoke all on function public.restore_order_stock(uuid) from public, anon, authenticated;
do $$
begin
  grant execute on function public.restore_order_stock(uuid) to service_role;
exception when undefined_object then
  null; -- only exists on Supabase
end;
$$;
