-- Nota Warungku backup/sync schema
-- Target: existing Supabase project mubarok-gadget-hub.
-- Scope is isolated by nota_warungku_* table names.
-- Apply through Supabase migrations; do not edit unrelated application tables.

create table if not exists public.nota_warungku_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.nota_warungku_menus (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.nota_warungku_categories(id) on delete restrict,
  name text not null check (btrim(name) <> ''),
  price integer not null check (price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nota_warungku_transactions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  receipt_no text not null,
  operational_date date not null,
  created_at timestamptz not null,
  total integer not null check (total >= 0),
  status text not null default 'PENDING_SYNC'
    check (status in ('PENDING_SYNC','SYNCED')),
  unique (owner_id, receipt_no)
);

create table if not exists public.nota_warungku_transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.nota_warungku_transactions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  menu_id uuid,
  menu_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal integer not null check (subtotal >= 0)
);

create index if not exists nota_warungku_menus_owner_idx
  on public.nota_warungku_menus(owner_id, is_active, sort_order);

create index if not exists nota_warungku_transactions_owner_date_idx
  on public.nota_warungku_transactions(owner_id, created_at desc);

create index if not exists nota_warungku_transaction_items_transaction_idx
  on public.nota_warungku_transaction_items(transaction_id);

alter table public.nota_warungku_categories enable row level security;
alter table public.nota_warungku_menus enable row level security;
alter table public.nota_warungku_transactions enable row level security;
alter table public.nota_warungku_transaction_items enable row level security;

create policy "nota categories owner select"
  on public.nota_warungku_categories for select to authenticated
  using (owner_id = auth.uid());
create policy "nota categories owner insert"
  on public.nota_warungku_categories for insert to authenticated
  with check (owner_id = auth.uid());
create policy "nota categories owner update"
  on public.nota_warungku_categories for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "nota menus owner select"
  on public.nota_warungku_menus for select to authenticated
  using (owner_id = auth.uid());
create policy "nota menus owner insert"
  on public.nota_warungku_menus for insert to authenticated
  with check (owner_id = auth.uid());
create policy "nota menus owner update"
  on public.nota_warungku_menus for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "nota transactions owner select"
  on public.nota_warungku_transactions for select to authenticated
  using (owner_id = auth.uid());
create policy "nota transactions owner insert"
  on public.nota_warungku_transactions for insert to authenticated
  with check (owner_id = auth.uid());

create policy "nota transaction items owner select"
  on public.nota_warungku_transaction_items for select to authenticated
  using (owner_id = auth.uid());
create policy "nota transaction items owner insert"
  on public.nota_warungku_transaction_items for insert to authenticated
  with check (owner_id = auth.uid());
