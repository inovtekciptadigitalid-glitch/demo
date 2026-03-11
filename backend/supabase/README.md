# Supabase Setup (Database Only)

Dokumen ini untuk menghubungkan **backend Laravel** demo ke **Supabase Postgres**.

## 1. Buat project Supabase
1. Buat project di Supabase.
2. Buka **Project Settings → Database**.
3. Salin host DB (`db.<project-ref>.supabase.co`), user, dan password.

## 2. Konfigurasi `.env`
Salin `.env.supabase.example` menjadi `.env` lalu isi:
- `DB_HOST`
- `DB_USERNAME`
- `DB_PASSWORD`
- `APP_URL` (URL backend online)
- `FRONTEND_URL` (URL frontend online)

Pastikan `DB_SSLMODE=require`.

## 3. Migrasi database
```bash
cd demo/backend
composer install
php artisan key:generate
php artisan migrate --force
```

## 4. Testing koneksi (opsional)
```bash
php artisan migrate:status
```

## Catatan
- Supabase dipakai **hanya sebagai database**. Auth tetap pakai Laravel Sanctum.
- Storage video masih local server Laravel. Untuk produksi, pertimbangkan storage S3/Cloud.
