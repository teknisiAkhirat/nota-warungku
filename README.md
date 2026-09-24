# Nota Warungku

Aplikasi nota sederhana, offline-first, untuk Warung Bu Sukarni.

## Architecture

- Frontend: React + Vite + PWA
- Primary transaction storage: IndexedDB on the Android device
- Backup/recovery target: Supabase/Postgres project `mubarok-gadget-hub`
- Hosting target: Cloudflare Pages
- WhatsApp: Android Share / plain-text receipt

## Offline-first behavior

Transaksi dibuat dan disimpan di IndexedDB terlebih dahulu. Setiap transaksi final mendapat nomor `YYMMDDNNN` berdasarkan operational day Asia/Jakarta (05:00–04:59).

Status lokal:
- `PENDING_SYNC` — belum berhasil dibackup
- `SYNCED` — backup Supabase berhasil

Sync menggunakan upsert dengan transaction ID dan client item ID yang stabil sehingga retry tidak membuat duplicate transaction.

## Recovery

Operator tidak perlu login.

Saat instalasi pertama, aplikasi membuat **kode pemulihan warung** acak dan menyimpannya di IndexedDB. Kode tersebut harus disimpan oleh pemilik/operator. Kode dipakai sebagai bearer credential untuk backup dan pemulihan pada perangkat baru.

Server hanya menyimpan SHA-256 dari kode melalui RLS; kode plaintext tidak pernah disimpan di database.

Perangkat baru dapat memilih **PULIHKAN DATA**, memasukkan kode pemulihan, lalu mengambil snapshot transaksi dari Supabase. Jika kode hilang, data cloud tidak dapat dipulihkan melalui aplikasi.

## Supabase security boundary

Nota Warungku menggunakan hanya project Supabase:

`mubarok-gadget-hub`

Frontend hanya memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`. Service-role/secret key tidak boleh masuk browser atau repository.

RLS hanya membuka tabel `nota_warungku_*` kepada request dengan recovery-key hash yang cocok. Tabel Mubarok lain tidak menjadi bagian dari aplikasi ini.

## PWA

Vite PWA menghasilkan manifest, service worker, dan precache asset. Data transaksi tetap berada di IndexedDB sehingga refresh/reopen tidak menghapus draft atau history.

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Verification rule

**NO EVIDENCE, NO DONE.**

Feature completion requires implementation, automated verification, and behavioral verification on the target Android device where applicable.
