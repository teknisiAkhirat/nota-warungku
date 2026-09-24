alter table public.nota_warungku_transactions alter column owner_key_hash set not null;
alter table public.nota_warungku_transaction_items alter column owner_key_hash set not null;
alter table public.nota_warungku_categories alter column owner_key_hash set not null;
alter table public.nota_warungku_menus alter column owner_key_hash set not null;