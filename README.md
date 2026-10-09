# Nota Warungku

Aplikasi nota sederhana, offline-first, untuk Warung Bu Sukarni.

## Architecture

- Frontend: React + Vite + PWA
- Offline transaction cache: IndexedDB on each device
- Shared menu/category catalog and transaction backup: existing Supabase/Postgres project `pukis-heru`
- Hosting target: Cloudflare Pages
- WhatsApp: Android Share / plain-text receipt

## Offline-first behavior

Transaksi dibuat dan disimpan di IndexedDB terlebih dahulu. Setiap transaksi final mendapat nomor `YYMMDDNNN` berdasarkan operational day Asia/Jakarta (05:00–04:59). Menu dan kategori dikirim ke Supabase langsung saat admin menekan SIMPAN; perangkat lain mengambil perubahan otomatis saat membuka aplikasi, kembali ke tab, atau melalui refresh berkala.

Status lokal:
- `PENDING_SYNC` — belum berhasil dibackup
- `SYNCED` — backup Supabase berhasil

Sync menggunakan upsert dengan transaction ID dan client item ID yang stabil sehingga retry tidak membuat duplicate transaction.

## Shared menu catalog

- Admin menu save writes to local IndexedDB first, then immediately upserts categories and menu items to Supabase.
- Other devices using the same recovery key refresh the shared catalog when the app opens, regains focus, or polls while visible.
- If the network is unavailable, the local save is kept and retried on a later app start; the UI reports that cloud sync failed.
- Existing local menu lists seed the cloud catalog only when that recovery key has no cloud menu catalog yet. Use the device with the most complete menu list as the initial source, then recover using its code on other devices.

## Recovery

Operator tidak perlu login.

Saat instalasi pertama, aplikasi membuat **kode pemulihan warung** acak dan menyimpannya di IndexedDB. Kode tersebut harus disimpan oleh pemilik/operator. Kode dipakai sebagai bearer credential untuk backup dan pemulihan pada perangkat baru.

Server hanya menyimpan SHA-256 dari kode melalui RLS; kode plaintext tidak pernah disimpan di database.

Perangkat baru dapat memilih **PULIHKAN DATA**, memasukkan kode pemulihan yang sama dengan perangkat utama, lalu mengambil menu/kategori bersama dan snapshot transaksi dari Supabase. Kode pemulihan adalah identitas akses bersama untuk satu warung; simpan dan gunakan kode yang sama di semua perangkat. Jika kode hilang, data cloud tidak dapat dipulihkan melalui aplikasi.

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
