# KarirKu Demo (Frontend + Backend)

Folder `demo` berisi versi demo yang terpisah:
- `demo/frontend` = frontend (copy dari `../frontend`)
- `demo/backend` = backend (copy dari `../backend`)

Tujuan: tampilan sama dengan local, tetapi bisa di‑deploy terpisah.

## Menjalankan Lokal

Frontend:
```bash
cd demo/frontend
npm install
npm run dev
```

Backend:
```bash
cd demo/backend
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host 0.0.0.0 --port 8001
```

## Konfigurasi Supabase (Backend)
Lihat panduan lengkap di `demo/backend/supabase/README.md`.

## Konfigurasi API (Frontend)
Salin `demo/frontend/.env.example` ke `.env` lalu sesuaikan:
- `VITE_API_URL=http://127.0.0.1:8001/api` (local)
- atau URL backend online (production)

## Deploy
- Frontend bisa di‑deploy ke Vercel dari folder `demo/frontend`.
- Backend bisa di‑deploy ke Render/Railway/VPS (gunakan Supabase sebagai DB).
