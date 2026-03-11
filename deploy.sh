#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
cd "$FRONTEND_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js tidak ditemukan. Install Node.js terlebih dulu."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm tidak ditemukan. Install npm terlebih dulu."
  exit 1
fi

if [ ! -f package.json ]; then
  echo "package.json tidak ditemukan. Pastikan demo/frontend sudah ada."
  exit 1
fi

echo "==> Install dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Build"
npm run build

if [ ! -d ".vercel" ]; then
  echo "==> Project belum terhubung ke Vercel. Jalankan sekali:"
  echo "    (dari folder demo/frontend) npx vercel link"
  echo "    (Setelah link, jalankan script ini lagi untuk deploy otomatis)"
  exit 1
fi

echo "==> Deploy ke Vercel (production)"
if [ -n "${VERCEL_TOKEN:-}" ]; then
  npx --yes vercel --prod --yes --token "$VERCEL_TOKEN"
else
  npx --yes vercel --prod --yes
fi
