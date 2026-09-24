# Nota Warungku

Aplikasi nota sederhana, offline-first, untuk Warung Bu Sukarni.

## Architecture

- Frontend: React + Vite + PWA
- Primary transaction storage: IndexedDB on the Android device
- Backup/recovery target: Supabase/Postgres
- Hosting target: Vercel
- WhatsApp: Android Share / plain-text receipt

## Supabase

Because a new Supabase project is not available on this account, this application uses the existing Supabase project `mubarok-gadget-hub`.

**Isolation rule:** Nota Warungku uses only tables prefixed `nota_warungku_`. Existing Mubarok tables are not modified.

The database migration is recorded in `supabase/migrations/20260924_nota_warungku_initial_schema.sql`.

RLS is enabled and scoped to `auth.uid()`. Therefore the production sync layer must authenticate a user/session before reading or writing cloud backup data. The frontend must never contain a service-role key.

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

A feature is only considered complete after implementation, automated tests, and behavioral verification on the target Android device where applicable.
