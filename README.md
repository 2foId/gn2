# Guyub Ngapak 

Aplikasi warga saling bantu berbasis kearifan lokal Purbalingga, sesuai tema bonus demografi.
Proyek sekolah — stack **Next.js 14 (App Router)** + **NestJS 10** + **PostgreSQL (Prisma)**.

---

# Daftar Isi

1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Fitur Utama](#fitur-utama)
3. [Tech Stack](#tech-stack)
4. [Struktur Folder](#struktur-folder)
5. [Setup & Instalasi](#setup--instalasi)
6. [Integrasi Provider WhatsApp (OTP)](#integrasi-provider-whatsapp-otp)
7. [Setup Webhook](#setup-webhook)
8. [Upload Gambar](#upload-gambar)
9. [Arsitektur Auth](#arsitektur-auth)
10. [Skema Database (Ringkasan)](#skema-database-ringkasan)
11. [Daftar Endpoint API](#daftar-endpoint-api)
12. [Troubleshooting](#troubleshooting)
13. [Catatan Keamanan untuk Production](#catatan-keamanan-untuk-production)

---

# Ringkasan Proyek

Guyub Ngapak adalah platform yang menghubungkan warga untuk saling membantu,
berbagi kearifan lokal, dan mengoordinasi kegiatan komunitas — dibangun dengan
identitas budaya Ngapak khas Purbalingga (Jawa Tengah). Tiga peran pengguna, Warga, Relwawan, dan Admin punya cakupan akses berbeda, dengan
verifikasi berlapis di level backend supaya tidak bisa dilewati dari sisi
tampilan saja.

# Fitur

# 1. Peta Butuh Guyub (+ Titip Peduli terintegrasi)
Peta interaktif Purbalingga yang menampilkan kebutuhan warga sebagai pin.
Alur: warga buat permintaan > menunggu verifikasi Relawan/RT atau Admin >
disetujui/ditolak > warga lain bisa menyatakan kesediaan membantu (disertai
komentar/catatan) dan menitipkan kepedulian langsung ke permintaan yang sudah
tervalidasi. Setiap permintaan bisa dilengkapi foto, tenggat waktu, dan
lokasi dipilih langsung dari peta (klik/tap, bukan input koordinat manual).
Pin ditandai "selesai" begitu bantuan tuntas disalurkan.

# 2. Wasiat Ngapak
Ruang berbagi kearifan lokal — resep, kerajinan, pertanian, filosofi hidup,
dan kategori bebas lainnya. Setiap wasiat bisa disimpan ke koleksi pribadi,
diberi rating bintang (1–5, satu kali per pengguna) yang dirata-rata dan
ditampilkan sebagai skor + jumlah pemberi rating, dan dilengkapi foto. 7
template siap pakai tersedia untuk mempercepat penulisan.

## Fase 1: Bonus Demografi 2045
- Penguatan profil warga: keahlian, tanggal lahir, dan ketersediaan untuk
  kebutuhan relawan dan penyaluran bantuan.
- Penambahan preferensi relawan di permintaan bantuan agar penugasan lebih
  sesuai dengan kemampuan dan kebutuhan kelompok.
- Sistem learning-path untuk wasiat: langkah belajar, kuis, progress, dan
  feedback dari penulis untuk meningkatkan pemahaman warga.
- Ringkasan dampak komunitas untuk dashboard kepemudaan dan kemajuan lokal.

# 3. UMKM Dibantu
Mempertemukan warga berketerampilan dengan UMKM lokal yang butuh bantuan naik
kelas (foto produk, desain, pemasaran). Pemilik usaha memasang kebutuhan
dengan tenggat waktu dan foto, warga lain merespons langsung.

# 4. Guyub Acara
Koordinasi kerja bakti, ronda, sedekah bumi — jadwal, daftar logistik (siapa
bawa apa), dan tiga cara absensi digital:
- Manual (tombol "Absen Hadir" oleh masing-masing warga yang login)
- Kode 4 digit di satu perangkat bersama (mirip absensi kertas), berlaku 3 menit
- QR code yang bisa diprint dan ditempel di lokasi, berlaku 1 hari, dipindai
  lewat kamera HP masing-masing warga

# 5. Pesan Antar Warga
Fitur perpesanan sederhana antar pengguna terdaftar, diakses lewat ikon amplop
di navbar.

# Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Leaflet |
| Backend | NestJS 10, Prisma ORM, PostgreSQL |
| Auth | JWT (access + refresh token rotation), Passport.js |
| Peta | Leaflet + OpenStreetMap (dikunci ke wilayah Purbalingga) |
| OTP/WhatsApp | Provider-agnostic — Meta Cloud API / Fonnte / Hybrid / Stub |
| Upload Gambar | Disk lokal via Multer (bukan cloud storage) |

# Folder

```
guyub-ngapak/
├── backend/            # NestJS API
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── bantuan/        # Peta Butuh Guyub + Titip Peduli
│   │   ├── wasiat/
│   │   ├── umkm/
│   │   ├── acara/
│   │   ├── messages/
│   │   ├── uploads/
│   │   └── whatsapp/       # provider OTP
│   └── uploads/         # file gambar tersimpan di sini (disk lokal)
└── frontend/            # Next.js App Router
    ├── app/
    │   ├── (auth)/login, register
    │   └── dashboard/peta, wasiat, umkm, acara, faq
    ├── components/
    └── lib/
```

# Setup & Instalasi

## Prasyarat
- Node.js LTS terbaru
- PostgreSQL berjalan lokal atau di server
- (Opsional untuk dev lokal) [ngrok](https://ngrok.com) — untuk expose backend ke internet saat testing webhook WhatsApp

## Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — minimal isi `DATABASE_URL`, dan generate secret acak untuk
`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (mis. `openssl rand -hex 32`).

```bash
npx prisma migrate dev --name init
npm run prisma:seed   # opsional, buat akun admin default
npm run start:dev
```

Backend berjalan di `http://localhost:3001/api`.
Swagger docs otomatis: `http://localhost:3001/api/docs`.

Akun admin default dari seed (**segera ganti password setelah login pertama**):
- Nomor HP: `081234567890`
- Password: `AdminGuyub123`

## Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Pastikan `.env.local` mengarah ke backend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Frontend berjalan di `http://localhost:3000`.

## Alur Coba Cepat

1. Buka `http://localhost:3000` > **Daftar** > isi form > dapat OTP
2. Kalau `WHATSAPP_PROVIDER=stub` atau `hybrid`, kode OTP muncul di **log
   terminal backend** (cari baris `[BACKUP LOG]` atau `[STUB]`)
3. Verifikasi OTP > login
4. Coba buat permintaan bantuan di Peta Butuh Guyub — statusnya "menunggu verifikasi"
5. Untuk approve, ubah role akun jadi `RELAWAN`/`ADMIN` lewat Prisma Studio:
   ```bash
   cd backend
   npx prisma studio
   ```
   Buka tabel `User`, ubah kolom `role`, save, lalu **logout-login ulang** di
   frontend (role baru baru terbaca setelah token JWT diterbitkan ulang)

## Integrasi Provider WhatsApp (OTP)

Diatur lewat `WHATSAPP_PROVIDER` di `.env` backend, bisa diganti kapan saja
tanpa ubah kode (lihat `src/whatsapp/`).

| Provider | Kapan dipakai | Butuh verifikasi bisnis? |
|---|---|---|
| `stub` | Development, OTP cukup dilihat di log | Tidak |
| `fonnte` | MVP/demo cepat, pakai nomor WA personal | Tidak |
| `meta` | Production jangka panjang, resmi dari Meta | Ya (2–5 hari kerja) |
| `hybrid` | Demo langsung di depan penilai — selalu log ke terminal **sekaligus** coba kirim sungguhan lewat Fonnte, tidak gagal total kalau Fonnte bermasalah | Tidak |

### Setup Fonnte (direkomendasikan untuk proyek sekolah)
1. Daftar di [fonnte.com](https://fonnte.com)
2. Hubungkan nomor WA (personal, bukan API bisnis resmi) dengan scan QR
3. Salin token device, isi ke `.env`:
   ```
   WHATSAPP_PROVIDER=fonnte
   FONNTE_TOKEN=token_dari_dashboard
   ```
4. Kalau device berstatus "Disconnected", scan ulang QR-nya di dashboard

### Setup Meta WhatsApp Cloud API (opsional, untuk production sungguhan)
1. Buat App "Business" di [developers.facebook.com](https://developers.facebook.com)
2. Aktifkan produk WhatsApp
3. Buat template kategori **Authentication**, nama `otp_verification`, bahasa Indonesia, Code delivery = Copy code
4. Isi `.env`:
   ```
   WHATSAPP_PROVIDER=meta
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   ```

## Setup Webhook

Endpoint sudah tersedia: `src/whatsapp/whatsapp-webhook.controller.ts`, route
`/api/webhooks/whatsapp` — wajib diisi di Meta App Dashboard meskipun
aplikasi ini hanya kirim OTP satu arah.

1. Isi `.env`: `WHATSAPP_WEBHOOK_VERIFY_TOKEN=string_acak_buatan_sendiri`
2. Dev lokal: jalankan `ngrok http 3001` di terminal terpisah
3. Di Meta Dashboard > WhatsApp > Configuration > Configure Webhooks:
   - Callback URL: `https://<url-ngrok>/api/webhooks/whatsapp`
   - Verify token: sama persis dengan `.env`
4. Klik **Verify and Save**

Tes manual tanpa Meta (langsung di browser):
```
http://localhost:3001/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN_KAMU&hub.challenge=test123
```
Harus menampilkan teks `test123` polos kalau setup benar.

## Upload Gambar

Semua modul (Peta, Wasiat, UMKM, Acara) mendukung upload gambar lewat
endpoint umum:

```
POST /api/uploads/image   (multipart/form-data, field "file")
> { "url": "/uploads/nama-file-acak.jpg" }
```

- Disimpan di **disk lokal server** (folder `backend/uploads/`), bukan cloud
  storage — cukup untuk kebutuhan sekolah/demo
- Maksimal **5 MB per file**, format JPG/PNG/WEBP/GIF
- URL hasil upload lalu disertakan sebagai array `gambar`/`foto` saat membuat
  data (permintaan bantuan, wasiat, dll)

⚠️ **Catatan**: kalau nanti di-deploy ke hosting seperti Vercel/Railway,
folder `uploads/` **tidak persisten** (hilang saat redeploy) — untuk
production sungguhan perlu pindah ke object storage (S3, Cloudinary, dll).

## Arsitektur Auth

- **Access Token** (15 menit) disimpan di **state memory frontend** (Zustand),
  bukan localStorage — mengurangi risiko pencurian lewat XSS
- **Refresh Token** (7 hari) disimpan di **httpOnly cookie**, tidak bisa
  diakses JavaScript, dirotasi setiap dipakai
- Axios interceptor otomatis panggil `/auth/refresh` saat Access Token
  kedaluwarsa (401), lalu mengulang request yang gagal
- `RolesGuard` dicek murni di backend lewat decorator `@Roles()` — tidak bisa
  dilewati hanya dengan memodifikasi frontend

## Skema Database (Ringkasan)

| Model | Fungsi |
|---|---|
| `User` | Data warga + role (WARGA/RELAWAN/ADMIN) |
| `RefreshToken`, `OtpCode` | Pendukung auth |
| `BantuanRequest`, `KesediaanBantu` | Peta Butuh Guyub + Titip Peduli |
| `Wasiat`, `WasiatSaved`, `WasiatComment` | Wasiat Ngapak (comment sekaligus rating) |
| `UmkmNeed`, `UmkmResponse` | UMKM Dibantu |
| `Acara`, `AcaraLogistik`, `AcaraAbsensi`, `AcaraPeserta` | Guyub Acara |
| `Message` | Pesan antar warga |
| `ProfileNote` | Catatan profil pengguna |

Diagram ERD detail: lihat `backend/prisma/schema.prisma` (sumber kebenaran
struktur data), atau generate visual lewat `npx prisma studio`.

## Daftar Endpoint API

Dokumentasi interaktif lengkap (request/response, coba langsung) tersedia di
Swagger: **`http://localhost:3001/api/docs`** saat backend berjalan.

Ringkasan grup endpoint:
- `POST /auth/register`, `/verify-otp`, `/login`, `/refresh`, `/logout`
- `GET/POST /bantuan`, `/bantuan/peta`, `/bantuan/verifikasi`, `PATCH /bantuan/:id/verifikasi`, `/status`, `/selesai`, `POST /bantuan/:id/kesediaan`
- `GET/POST /wasiat`, `POST /wasiat/:id/simpan`, `/komentar`
- `GET/POST /umkm`, `POST /umkm/:id/respon`
- `GET/POST /acara`, `POST /acara/:id/logistik`, `/absen`, `/kode-absen`, `/qr`
- `POST /messages`, `GET /messages/inbox`, `/thread/:userId`
- `POST /uploads/image`
- `GET/POST /webhooks/whatsapp`

## Troubleshooting

Masalah yang pernah ditemui selama development proyek ini, beserta solusinya
— berguna kalau pengembang lain melanjutkan proyek ini:

| Gejala | Penyebab | Solusi |
|---|---|---|
| Webhook Meta: `404 Cannot GET /api` | URL webhook belum lengkap | Pastikan path `/api/webhooks/whatsapp`, bukan cuma `/api` |
| Webhook Meta: `403 Forbidden` saat verify | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` di `.env` beda dengan yang diisi di dashboard Meta | Cocokkan persis, tanpa spasi/tanda kutip ekstra, restart backend setelah edit `.env` |
| `Cannot create message template` di Meta | Kategori Authentication butuh verifikasi bisnis | Untuk proyek sekolah, pakai provider `fonnte` atau `hybrid` — tidak perlu verifikasi |
| OTP gagal kirim: `"reason":"request invalid on disconnected device"` (Fonnte) | Device WA di Fonnte terputus dari server | Buka dashboard Fonnte > scan ulang QR di menu Device |
| `AxiosError 400` saat submit form tanpa pesan jelas | Validasi backend (`class-validator`) menolak input tapi frontend tidak menampilkan pesannya | Cek `err.response.data.message` di response, tampilkan ke user, jangan biarkan cuma error di console |
| Zip project jadi ratusan MB | `node_modules` dan `.next` ikut ter-zip | Selalu exclude folder itu; gunakan `.gitignore` |
| Field baru di Prisma schema tapi query error `invalid input value for enum` | Lupa jalankan migrasi setelah edit `schema.prisma` | `npx prisma migrate dev --name <nama_perubahan>` |

## Catatan Keamanan untuk Production

- Set `COOKIE_SECURE=true` di `.env` backend saat production (wajib HTTPS)
- Pastikan `FRONTEND_URL` sesuai domain frontend production
- Jangan pernah commit `.env` / `.env.local` ke repository — gunakan `.gitignore`
- Ganti provider WhatsApp ke `meta` (resmi) untuk stabilitas jangka panjang,
  `fonnte`/`hybrid` cukup untuk demo/MVP
- Pindahkan penyimpanan gambar dari disk lokal ke object storage (S3,
  Cloudinary, dll) sebelum deploy ke platform yang tidak punya disk persisten
