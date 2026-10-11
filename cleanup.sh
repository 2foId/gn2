#!/bin/bash

echo "Menghapus folder berat..."

# Backend
cd backend
rm -rf node_modules dist .turbo
echo "✓ backend: node_modules, dist, .turbo"
cd ..

# Frontend
cd frontend
rm -rf node_modules .next .turbo
echo "✓ frontend: node_modules, .next, .turbo"
cd ..

echo "Selesai! Ukuran folder berkurang ~1–3 GB"
echo "Jalankan 'npm install' di masing-masing folder setelah extract."