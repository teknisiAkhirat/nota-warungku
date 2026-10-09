-- Nota Warungku uses a recovery-key hash, not Supabase Auth user IDs.
-- Keep owner_id as an optional legacy column; the browser sync payload does not send it.
alter table public.nota_warungku_transactions alter column owner_id drop not null;
alter table public.nota_warungku_transaction_items alter column owner_id drop not null;
alter table public.nota_warungku_categories alter column owner_id drop not null;
alter table public.nota_warungku_menus alter column owner_id drop not null;

-- Every sync/recovery row must carry the hash used by the RLS policies.
alter table public.nota_warungku_transactions alter column owner_key_hash set not null;
alter table public.nota_warungku_transaction_items alter column owner_key_hash set not null;
alter table public.nota_warungku_categories alter column owner_key_hash set not null;
alter table public.nota_warungku_menus alter column owner_key_hash set not null;
