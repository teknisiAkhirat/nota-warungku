-- Recovery-key RLS for Nota Warungku in mubarok-gadget-hub.
-- The browser uses only the publishable key plus a per-warung recovery key.
alter table public.nota_warungku_transactions drop constraint if exists nota_warungku_transactions_owner_id_fkey;
alter table public.nota_warungku_transaction_items drop constraint if exists nota_warungku_transaction_items_owner_id_fkey;
alter table public.nota_warungku_categories drop constraint if exists nota_warungku_categories_owner_id_fkey;
alter table public.nota_warungku_menus drop constraint if exists nota_warungku_menus_owner_id_fkey;
alter table public.nota_warungku_transactions add column if not exists owner_key_hash text;
alter table public.nota_warungku_transaction_items add column if not exists owner_key_hash text;
alter table public.nota_warungku_categories add column if not exists owner_key_hash text;
alter table public.nota_warungku_menus add column if not exists owner_key_hash text;
alter table public.nota_warungku_transaction_items add column if not exists category_name text not null default '';
create or replace function public.nota_warungku_request_hash() returns text language sql stable as $$
 select encode(extensions.digest(coalesce(current_setting('request.headers', true)::json->>'x-warung-key',''),'sha256'),'hex')
$$;
do $$ declare p record; begin
 for p in select policyname,tablename from pg_policies where schemaname='public' and tablename like 'nota_warungku_%' loop execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename); end loop; end $$;
revoke all on public.nota_warungku_transactions,public.nota_warungku_transaction_items,public.nota_warungku_categories,public.nota_warungku_menus from authenticated;
grant select,insert,update on public.nota_warungku_transactions,public.nota_warungku_transaction_items,public.nota_warungku_categories,public.nota_warungku_menus to anon;
create policy "nota transactions key select" on public.nota_warungku_transactions for select to anon using(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota transactions key insert" on public.nota_warungku_transactions for insert to anon with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota transactions key update" on public.nota_warungku_transactions for update to anon using(owner_key_hash=public.nota_warungku_request_hash()) with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota items key select" on public.nota_warungku_transaction_items for select to anon using(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota items key insert" on public.nota_warungku_transaction_items for insert to anon with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota items key update" on public.nota_warungku_transaction_items for update to anon using(owner_key_hash=public.nota_warungku_request_hash()) with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota categories key select" on public.nota_warungku_categories for select to anon using(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota categories key insert" on public.nota_warungku_categories for insert to anon with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota categories key update" on public.nota_warungku_categories for update to anon using(owner_key_hash=public.nota_warungku_request_hash()) with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota menus key select" on public.nota_warungku_menus for select to anon using(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota menus key insert" on public.nota_warungku_menus for insert to anon with check(owner_key_hash=public.nota_warungku_request_hash());
create policy "nota menus key update" on public.nota_warungku_menus for update to anon using(owner_key_hash=public.nota_warungku_request_hash()) with check(owner_key_hash=public.nota_warungku_request_hash());