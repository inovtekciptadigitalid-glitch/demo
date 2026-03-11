#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js tidak ditemukan. Install Node.js terlebih dulu."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm tidak ditemukan. Install npm terlebih dulu."
  exit 1
fi

if [ ! -f package.json ]; then
  echo "package.json tidak ditemukan. Jalankan script ini dari folder demo."
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
  echo "    npx vercel link"
  echo "    (Setelah link, jalankan script ini lagi untuk deploy otomatis)"
  exit 1
fi

echo "==> Deploy ke Vercel (production)"
if [ -n "${VERCEL_TOKEN:-}" ]; then
  npx --yes vercel --prod --yes --token "$VERCEL_TOKEN"
else
  npx --yes vercel --prod --yes
fi
