-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WARGA', 'RELAWAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "BantuanStatus" AS ENUM ('MENUNGGU_VERIFIKASI', 'AKTIF', 'DIPROSES', 'SELESAI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "BantuanKategori" AS ENUM ('MEDIS', 'KERUSAKAN_RUMAH', 'TENAGA_KERJA', 'LAINNYA');

-- CreateEnum
CREATE TYPE "WasiatKategori" AS ENUM ('KULINER', 'KERAJINAN', 'PERTANIAN', 'FILOSOFI');

-- CreateEnum
CREATE TYPE "TitipPeduliStatus" AS ENUM ('MENUNGGU', 'DIKONFIRMASI', 'TERSALURKAN');

-- CreateEnum
CREATE TYPE "UmkmNeedStatus" AS ENUM ('DIBUKA', 'DALAM_PROSES', 'SELESAI');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kontak" TEXT NOT NULL,
    "dusun" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'WARGA',
    "kontakVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bantuan_requests" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kategori" "BantuanKategori" NOT NULL,
    "status" "BantuanStatus" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "alamat" TEXT,
    "pembuatId" TEXT NOT NULL,
    "verifikatorId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bantuan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kesediaan_bantu" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kesediaan_bantu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wasiat" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori" "WasiatKategori" NOT NULL,
    "isi" TEXT NOT NULL,
    "poinKiat" TEXT[],
    "penulisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wasiat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wasiat_saved" (
    "id" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wasiat_saved_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wasiat_comments" (
    "id" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wasiat_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titip_peduli" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "pemberiId" TEXT NOT NULL,
    "jumlah" DECIMAL(12,2),
    "jenisBantuan" TEXT NOT NULL,
    "catatan" TEXT,
    "status" "TitipPeduliStatus" NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titip_peduli_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umkm_needs" (
    "id" TEXT NOT NULL,
    "namaUsaha" TEXT NOT NULL,
    "kebutuhan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "status" "UmkmNeedStatus" NOT NULL DEFAULT 'DIBUKA',
    "pemilikId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "umkm_needs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "umkm_responses" (
    "id" TEXT NOT NULL,
    "needId" TEXT NOT NULL,
    "penolongId" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umkm_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acara" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "waktuMulai" TIMESTAMP(3) NOT NULL,
    "waktuSelesai" TIMESTAMP(3),
    "pembuatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acara_logistik" (
    "id" TEXT NOT NULL,
    "acaraId" TEXT NOT NULL,
    "itemNama" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "penanggungJawab" TEXT,
    "dipenuhi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acara_logistik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acara_absensi" (
    "id" TEXT NOT NULL,
    "acaraId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hadir" BOOLEAN NOT NULL DEFAULT true,
    "waktuAbsen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acara_absensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_kontak_key" ON "users"("kontak");

-- CreateIndex
CREATE UNIQUE INDEX "kesediaan_bantu_requestId_userId_key" ON "kesediaan_bantu"("requestId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "wasiat_saved_wasiatId_userId_key" ON "wasiat_saved"("wasiatId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "acara_absensi_acaraId_userId_key" ON "acara_absensi"("acaraId", "userId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bantuan_requests" ADD CONSTRAINT "bantuan_requests_pembuatId_fkey" FOREIGN KEY ("pembuatId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bantuan_requests" ADD CONSTRAINT "bantuan_requests_verifikatorId_fkey" FOREIGN KEY ("verifikatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kesediaan_bantu" ADD CONSTRAINT "kesediaan_bantu_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "bantuan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kesediaan_bantu" ADD CONSTRAINT "kesediaan_bantu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wasiat" ADD CONSTRAINT "wasiat_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wasiat_saved" ADD CONSTRAINT "wasiat_saved_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wasiat_saved" ADD CONSTRAINT "wasiat_saved_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wasiat_comments" ADD CONSTRAINT "wasiat_comments_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wasiat_comments" ADD CONSTRAINT "wasiat_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titip_peduli" ADD CONSTRAINT "titip_peduli_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "bantuan_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titip_peduli" ADD CONSTRAINT "titip_peduli_pemberiId_fkey" FOREIGN KEY ("pemberiId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_needs" ADD CONSTRAINT "umkm_needs_pemilikId_fkey" FOREIGN KEY ("pemilikId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_responses" ADD CONSTRAINT "umkm_responses_needId_fkey" FOREIGN KEY ("needId") REFERENCES "umkm_needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_responses" ADD CONSTRAINT "umkm_responses_penolongId_fkey" FOREIGN KEY ("penolongId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acara" ADD CONSTRAINT "acara_pembuatId_fkey" FOREIGN KEY ("pembuatId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acara_logistik" ADD CONSTRAINT "acara_logistik_acaraId_fkey" FOREIGN KEY ("acaraId") REFERENCES "acara"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acara_absensi" ADD CONSTRAINT "acara_absensi_acaraId_fkey" FOREIGN KEY ("acaraId") REFERENCES "acara"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acara_absensi" ADD CONSTRAINT "acara_absensi_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
