-- CreateEnum
CREATE TYPE "IklanStatus" AS ENUM ('DRAFT', 'MENUNGGU', 'DISETUJUI', 'DITOLAK', 'DITARIK', 'BERAKHIR');

-- CreateEnum
CREATE TYPE "IklanKeputusan" AS ENUM ('SETUJUI', 'TOLAK', 'REVISI', 'TARIK');

-- CreateEnum
CREATE TYPE "TransaksiIklanTipe" AS ENUM ('BELI', 'KEMBALI');

-- CreateTable
CREATE TABLE "iklan" (
    "id" TEXT NOT NULL,
    "pemilikId" TEXT NOT NULL,
    "judul" VARCHAR(40) NOT NULL,
    "deskripsi" VARCHAR(140) NOT NULL,
    "bidang" TEXT NOT NULL,
    "kabupatenKota" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "status" "IklanStatus" NOT NULL DEFAULT 'DRAFT',
    "alasanTolak" TEXT,
    "catatanRevisi" TEXT,
    "jumlahRevisi" INTEGER NOT NULL DEFAULT 0,
    "mulaiAt" TIMESTAMP(3),
    "berakhirAt" TIMESTAMP(3),
    "kuotaHarian" INTEGER NOT NULL DEFAULT 100,
    "dibuatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbaruiAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iklan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tayangan_iklan" (
    "id" TEXT NOT NULL,
    "iklanId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "tayang" INTEGER NOT NULL DEFAULT 0,
    "klik" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tayangan_iklan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_transaksi_iklan" (
    "id" TEXT NOT NULL,
    "iklanId" TEXT NOT NULL,
    "pemilikId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tipe" "TransaksiIklanTipe" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_transaksi_iklan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderasi_iklan" (
    "id" TEXT NOT NULL,
    "iklanId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "keputusan" "IklanKeputusan" NOT NULL,
    "alasan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderasi_iklan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iklan_pemilikId_status_idx" ON "iklan"("pemilikId", "status");

-- CreateIndex
CREATE INDEX "iklan_status_mulaiAt_berakhirAt_idx" ON "iklan"("status", "mulaiAt", "berakhirAt");

-- CreateIndex
CREATE UNIQUE INDEX "tayangan_iklan_iklanId_tanggal_key" ON "tayangan_iklan"("iklanId", "tanggal");

-- CreateIndex
CREATE INDEX "tayangan_iklan_tanggal_idx" ON "tayangan_iklan"("tanggal");

-- CreateIndex
CREATE INDEX "log_transaksi_iklan_iklanId_idx" ON "log_transaksi_iklan"("iklanId");

-- CreateIndex
CREATE INDEX "log_transaksi_iklan_pemilikId_idx" ON "log_transaksi_iklan"("pemilikId");

-- CreateIndex
CREATE INDEX "moderasi_iklan_iklanId_idx" ON "moderasi_iklan"("iklanId");

-- CreateIndex
CREATE INDEX "moderasi_iklan_adminId_idx" ON "moderasi_iklan"("adminId");

-- AddForeignKey
ALTER TABLE "iklan" ADD CONSTRAINT "iklan_pemilikId_fkey" FOREIGN KEY ("pemilikId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tayangan_iklan" ADD CONSTRAINT "tayangan_iklan_iklanId_fkey" FOREIGN KEY ("iklanId") REFERENCES "iklan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_transaksi_iklan" ADD CONSTRAINT "log_transaksi_iklan_iklanId_fkey" FOREIGN KEY ("iklanId") REFERENCES "iklan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderasi_iklan" ADD CONSTRAINT "moderasi_iklan_iklanId_fkey" FOREIGN KEY ("iklanId") REFERENCES "iklan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderasi_iklan" ADD CONSTRAINT "moderasi_iklan_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON UPDATE CASCADE;
