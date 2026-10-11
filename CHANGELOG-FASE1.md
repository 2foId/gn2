# Changelog Fase 1 — Bonus Demografi 2045

## Ringkasan

Fase 1 memperkuat fondasi aplikasi Guyub Ngapak dengan fitur yang menguatkan peran kepemudaan, kontribusi lokal, dan ekosistem bantuan berbasis komunitas.

## Perubahan utama

- Profil pengguna diperluas dengan `keahlian`, `tanggalLahir`, dan `ketersediaan`.
- Permintaan bantuan kini memiliki `preferensiRelawan` untuk memfilter relawan yang cocok.
- Modifikasi wasiat untuk mendukung learning path, kuis, progress, dan feedback penulis.
- Ringkasan dampak komunitas disediakan melalui modul `dampak`.
- Frontend diperbarui pada profil, peta, dan halaman wasiat sesuai dengan skema baru.

## File penting

- `backend/prisma/schema.prisma`
- `backend/src/bantuan/bantuan.service.ts`
- `backend/src/wasiat/wasiat.service.ts`
- `backend/src/wasiat/wasiat.controller.ts`
- `backend/src/dampak/dampak.service.ts`
- `frontend/app/dashboard/wasiat/page.tsx`
- `frontend/app/dashboard/wasiat/[id]/page.tsx`
- `frontend/components/ProfileOverlay.tsx`
- `frontend/app/dashboard/peta/page.tsx`
