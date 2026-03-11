# KarirKu Demo (Standalone)

Folder ini berisi demo standalone untuk presentasi ke client. Tidak terhubung ke backend dan tidak bergantung pada folder `frontend`/`backend`.

## Jalankan lokal (tanpa build)
Buka `demo/index.html` langsung di browser, atau pakai server statis:

```bash
cd demo
python3 -m http.server 5175
```
Lalu buka `http://127.0.0.1:5175`.

## Jalankan lokal (Vite)
```bash
cd demo
npm install
npm run dev
```
Lalu buka `http://127.0.0.1:5175`.

## Deploy ke Vercel (gratis)
1. Buat project baru di Vercel.
2. Set **Root Directory** ke `demo`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

Catatan:
- Demo ini hanya UI interaktif lokal (data disimpan di localStorage).
- Tidak perlu env atau backend.
