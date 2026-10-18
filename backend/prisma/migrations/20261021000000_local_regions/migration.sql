CREATE TYPE "LocalRegionStatus" AS ENUM ('AKTIF', 'SEGERA_HADIR');

CREATE TABLE "local_regions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "status" "LocalRegionStatus" NOT NULL DEFAULT 'SEGERA_HADIR',
    "ringkasan" TEXT,
    "pertanyaanPemantik" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "local_regions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "local_articles" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "judul" VARCHAR(150) NOT NULL,
    "ringkasan" VARCHAR(500) NOT NULL,
    "sumber" VARCHAR(120) NOT NULL,
    "tautan" TEXT NOT NULL,
    "terverifikasi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "local_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "local_articles_tautan_http_check" CHECK ("tautan" ~* '^https?://')
);

CREATE UNIQUE INDEX "local_regions_slug_key" ON "local_regions"("slug");
CREATE INDEX "local_articles_regionId_terverifikasi_createdAt_idx" ON "local_articles"("regionId", "terverifikasi", "createdAt");

ALTER TABLE "local_articles" ADD CONSTRAINT "local_articles_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "local_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;