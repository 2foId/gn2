/*
  Warnings:

  - A unique constraint covering the columns `[kodeQr]` on the table `acara` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "acara" ADD COLUMN     "foto" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kodeQr" TEXT,
ADD COLUMN     "kodeQrExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "bantuan_requests" ADD COLUMN     "dibutuhkanSebelum" TIMESTAMP(3),
ADD COLUMN     "foto" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "umkm_needs" ADD COLUMN     "dibutuhkanSebelum" TIMESTAMP(3),
ADD COLUMN     "foto" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "wasiat" ADD COLUMN     "foto" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "wasiat_comments" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "acara_peserta" (
    "id" TEXT NOT NULL,
    "acaraId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acara_peserta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acara_peserta_acaraId_userId_key" ON "acara_peserta"("acaraId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "acara_peserta_acaraId_kode_key" ON "acara_peserta"("acaraId", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "acara_kodeQr_key" ON "acara"("kodeQr");

-- AddForeignKey
ALTER TABLE "acara_peserta" ADD CONSTRAINT "acara_peserta_acaraId_fkey" FOREIGN KEY ("acaraId") REFERENCES "acara"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acara_peserta" ADD CONSTRAINT "acara_peserta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
