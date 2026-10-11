CREATE TYPE "KesediaanStatus" AS ENUM ('AKTIF', 'DIBATALKAN');

ALTER TABLE "bantuan_requests"
  ADD COLUMN "selesaiAt" TIMESTAMP(3);

-- Tanggal lama yang sudah berstatus selesai memakai updatedAt sebagai waktu selesai.
UPDATE "bantuan_requests"
SET "selesaiAt" = "updatedAt"
WHERE "status" = 'SELESAI' AND "selesaiAt" IS NULL;

ALTER TABLE "kesediaan_bantu"
  ADD COLUMN "status" "KesediaanStatus" NOT NULL DEFAULT 'AKTIF',
  ADD COLUMN "dibatalkanAt" TIMESTAMP(3);
