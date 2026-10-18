CREATE TYPE "JamKontribusiStatus" AS ENUM ('MENUNGGU', 'TERKONFIRMASI', 'DITOLAK', 'KEDALUWARSA');

CREATE TABLE "jam_kontribusi" (
    "id" TEXT NOT NULL,
    "bantuanId" TEXT NOT NULL,
    "penggerakId" TEXT NOT NULL,
    "jumlahJam" DECIMAL(4,1) NOT NULL,
    "catatan" VARCHAR(300),
    "status" "JamKontribusiStatus" NOT NULL DEFAULT 'MENUNGGU',
    "diajukanAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dikonfirmasiAt" TIMESTAMP(3),
    "batasKonfirmasiAt" TIMESTAMP(3) NOT NULL,
    "alasanTolak" VARCHAR(200),

    CONSTRAINT "jam_kontribusi_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "jam_kontribusi_jumlahJam_check" CHECK ("jumlahJam" >= 0.5 AND "jumlahJam" <= 12)
);

CREATE UNIQUE INDEX "jam_kontribusi_bantuanId_key" ON "jam_kontribusi"("bantuanId");
CREATE INDEX "jam_kontribusi_penggerakId_status_idx" ON "jam_kontribusi"("penggerakId", "status");
CREATE INDEX "jam_kontribusi_status_batasKonfirmasiAt_idx" ON "jam_kontribusi"("status", "batasKonfirmasiAt");

ALTER TABLE "jam_kontribusi" ADD CONSTRAINT "jam_kontribusi_bantuanId_fkey"
    FOREIGN KEY ("bantuanId") REFERENCES "bantuan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jam_kontribusi" ADD CONSTRAINT "jam_kontribusi_penggerakId_fkey"
    FOREIGN KEY ("penggerakId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;