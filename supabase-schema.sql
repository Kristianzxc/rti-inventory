-- ============================================================
-- AssetVault — Supabase Database Schema
-- Run this in your Supabase SQL Editor (in order)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'utility-admin'
    check (role in ('tech-admin', 'utility-admin')),
  department text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: users can read all profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- RLS: users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'utility-admin')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. BUILDINGS
-- ────────────────────────────────────────────────────────────
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  floors integer default 1,
  created_at timestamptz not null default now()
);

alter table public.buildings enable row level security;

create policy "Buildings viewable by authenticated"
  on public.buildings for select using (auth.role() = 'authenticated');

create policy "Tech-admin can insert buildings"
  on public.buildings for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
  );

create policy "Tech-admin can update buildings"
  on public.buildings for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
  );

create policy "Tech-admin can delete buildings"
  on public.buildings for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
  );


-- ────────────────────────────────────────────────────────────
-- 3. ASSET CATEGORIES
-- ────────────────────────────────────────────────────────────
create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text,
  icon text,
  created_at timestamptz not null default now()
);

alter table public.asset_categories enable row level security;

create policy "Categories viewable by authenticated"
  on public.asset_categories for select using (auth.role() = 'authenticated');

create policy "Tech-admin can manage categories"
  on public.asset_categories for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin'));


-- ────────────────────────────────────────────────────────────
-- 4. ASSETS (core table)
-- ────────────────────────────────────────────────────────────
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  name text not null,
  description text,
  category_id uuid references public.asset_categories(id) on delete set null,
  building_id uuid references public.buildings(id) on delete set null,
  floor_room text,
  serial_number text,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'maintenance', 'retired')),
  condition text default 'good'
    check (condition in ('excellent', 'good', 'fair', 'poor')),
  image_url text,
  assigned_to text,
  purchase_date date,
  maintenance_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

-- Index for performance
create index if not exists assets_status_idx on public.assets(status);
create index if not exists assets_building_idx on public.assets(building_id);
create index if not exists assets_category_idx on public.assets(category_id);
create index if not exists assets_created_at_idx on public.assets(created_at desc);

create policy "Assets viewable by authenticated"
  on public.assets for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert assets"
  on public.assets for insert
  with check (auth.role() = 'authenticated');

create policy "Tech-admin or creator can update assets"
  on public.assets for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
    or created_by = auth.uid()
  );

create policy "Tech-admin can delete assets"
  on public.assets for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
  );

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger assets_updated_at
  before update on public.assets
  for each row execute procedure public.update_updated_at();


-- ────────────────────────────────────────────────────────────
-- 5. MAINTENANCE LOGS
-- ────────────────────────────────────────────────────────────
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  notes text,
  maintenance_date timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete set null,
  status text default 'completed'
    check (status in ('completed', 'scheduled', 'overdue')),
  cost numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.maintenance_logs enable row level security;

create index if not exists maintenance_asset_idx on public.maintenance_logs(asset_id);

create policy "Maintenance logs viewable by authenticated"
  on public.maintenance_logs for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert maintenance logs"
  on public.maintenance_logs for insert
  with check (auth.role() = 'authenticated');

create policy "Tech-admin can update/delete maintenance logs"
  on public.maintenance_logs for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin'));


-- ────────────────────────────────────────────────────────────
-- 6. SEED DATA
-- ────────────────────────────────────────────────────────────

-- Insert buildings
insert into public.buildings (name, description, floors) values
  ('Building A', 'Main administrative and technology hub', 4),
  ('Building B', 'Laboratory and research facilities', 3),
  ('Building C', 'Utility and auxiliary facilities', 2),
  ('Warehouse', 'Equipment storage and distribution center', 1)
on conflict do nothing;

-- Insert asset categories
insert into public.asset_categories (name, type, icon) values
  ('PC Sets', 'Technology', '🖥️'),
  ('Laptops', 'Technology', '💻'),
  ('Servers', 'Technology', '🗄️'),
  ('Monitors', 'Technology', '🖥️'),
  ('Networking Devices', 'Technology', '🌐'),
  ('Printers', 'Technology', '🖨️'),
  ('CCTV', 'Security', '📷'),
  ('Projectors', 'Office Equipment', '📽️'),
  ('Chairs', 'Utility', '🪑'),
  ('Tables', 'Utility', '🪵'),
  ('Stand Fans', 'Utility', '💨'),
  ('Cabinets', 'Utility', '🗃️'),
  ('Whiteboards', 'Utility', '📋'),
  ('Air Conditioners', 'Utility', '❄️'),
  ('Laboratory Equipment', 'Laboratory', '🔬')
on conflict (name) do nothing;

-- ────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET
-- ────────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket:
--   Name: asset-images
--   Public: true
--   File size limit: 5MB
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- Storage RLS policies (run after creating bucket):
insert into storage.buckets (id, name, public)
  values ('asset-images', 'asset-images', true)
  on conflict (id) do nothing;

create policy "Anyone can view asset images"
  on storage.objects for select
  using (bucket_id = 'asset-images');

create policy "Authenticated users can upload asset images"
  on storage.objects for insert
  with check (bucket_id = 'asset-images' and auth.role() = 'authenticated');

create policy "Authenticated users can update asset images"
  on storage.objects for update
  using (bucket_id = 'asset-images' and auth.role() = 'authenticated');

create policy "Tech-admin can delete asset images"
  on storage.objects for delete
  using (
    bucket_id = 'asset-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'tech-admin')
  );
