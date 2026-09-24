-- Sync idempotency hardening for Nota Warungku in mubarok-gadget-hub.
alter table public.nota_warungku_transactions add column if not exists updated_at timestamptz not null default now();
alter table public.nota_warungku_transactions drop constraint if exists nota_warungku_transactions_status_check;
alter table public.nota_warungku_transactions add constraint nota_warungku_transactions_status_check check (status in ('PENDING_SYNC','SYNCED'));
create index if not exists nota_warungku_transactions_receipt_idx on public.nota_warungku_transactions(owner_id,receipt_no);
alter table public.nota_warungku_transaction_items add column if not exists client_item_id text;
update public.nota_warungku_transaction_items set client_item_id=id::text where client_item_id is null;
alter table public.nota_warungku_transaction_items alter column client_item_id set not null;
create unique index if not exists nota_warungku_transaction_items_client_idx on public.nota_warungku_transaction_items(transaction_id,client_item_id);
create policy "nota transactions owner update" on public.nota_warungku_transactions for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "nota transaction items owner update" on public.nota_warungku_transaction_items for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());