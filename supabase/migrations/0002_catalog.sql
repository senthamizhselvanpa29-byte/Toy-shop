-- Toy Shop · Milestone 4: categories, products and product photos.
-- Run once in Supabase → SQL Editor, after 0001_owner_auth.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- 1. Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  slug text not null unique,
  icon text not null default '🧸',
  color text not null default 'sunshine'
    check (color in ('sunshine', 'sky', 'bubblegum', 'mint', 'orange', 'grape')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

insert into public.categories (name, slug, icon, color, position) values
  ('Vehicles', 'vehicles', '🚗', 'sky', 1),
  ('Puzzles', 'puzzles', '🧩', 'grape', 2),
  ('Soft Toys', 'soft-toys', '🧸', 'bubblegum', 3),
  ('Art & Craft', 'art-craft', '🎨', 'orange', 4),
  ('Learning', 'learning', '📚', 'mint', 5),
  ('Outdoor', 'outdoor', '⚽', 'sunshine', 6),
  ('Electronic', 'electronic', '🎮', 'sky', 7),
  ('Baby', 'baby', '👶', 'bubblegum', 8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Products (prices are whole paise: ₹1 = 100 paise)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  age_group text not null default '3-5'
    check (age_group in ('0-2', '3-5', '6-8', '9-12', '12+')),
  brand text not null default '',
  price_paise integer not null check (price_paise >= 0),
  mrp_paise integer check (mrp_paise is null or mrp_paise >= price_paise),
  stock integer not null default 0 check (stock >= 0),
  sku text unique,
  gst_rate smallint not null default 12 check (gst_rate in (0, 5, 12, 18, 28)),
  weight_grams integer check (weight_grams is null or weight_grams > 0),
  bis_license text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status, created_at desc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Product photos (position 0 is the cover photo)
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create index if not exists product_images_product_idx
  on public.product_images (product_id, position);

-- ---------------------------------------------------------------------------
-- 4. Access rules: everyone can look, only the owner can change
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can view categories" on public.categories;
create policy "Anyone can view categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Owner manages categories" on public.categories;
create policy "Owner manages categories"
  on public.categories for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "View published products, owner views all" on public.products;
create policy "View published products, owner views all"
  on public.products for select
  to anon, authenticated
  using (status = 'published' or (select public.is_owner()));

drop policy if exists "Owner manages products" on public.products;
create policy "Owner manages products"
  on public.products for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "View photos of visible products" on public.product_images;
create policy "View photos of visible products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id)
  );

drop policy if exists "Owner manages product photos" on public.product_images;
create policy "Owner manages product photos"
  on public.product_images for all
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- ---------------------------------------------------------------------------
-- 5. Photo storage: public to view, only the owner can upload or delete
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public photo links work without this; Supabase needs it to delete files.
drop policy if exists "Owner lists product photos" on storage.objects;
create policy "Owner lists product photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_owner()));

drop policy if exists "Owner uploads product photos" on storage.objects;
create policy "Owner uploads product photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_owner()));

drop policy if exists "Owner updates product photos" on storage.objects;
create policy "Owner updates product photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_owner()));

drop policy if exists "Owner deletes product photos" on storage.objects;
create policy "Owner deletes product photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_owner()));
