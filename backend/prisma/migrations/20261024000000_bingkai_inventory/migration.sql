-- Create bingkai_profil table
CREATE TABLE "bingkai_profil" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" VARCHAR(40) NOT NULL,
    "harga" INTEGER NOT NULL,
    "gaya" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bingkai_profil_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bingkai_profil_kode_key" UNIQUE ("kode")
);

-- Create kepemilikan_bingkai table
CREATE TABLE "kepemilikan_bingkai" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bingkaiId" TEXT NOT NULL,
    "dibeliAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kepemilikan_bingkai_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kepemilikan_bingkai_userId_bingkaiId_key" UNIQUE ("userId", "bingkaiId"),
    CONSTRAINT "kepemilikan_bingkai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kepemilikan_bingkai_bingkaiId_fkey" FOREIGN KEY ("bingkaiId") REFERENCES "bingkai_profil"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Alter users table: add bingkaiAktifId column and relation
ALTER TABLE "users" ADD COLUMN "bingkaiAktifId" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_bingkaiAktifId_fkey" FOREIGN KEY ("bingkaiAktifId") REFERENCES "bingkai_profil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed 4 bingkai contoh
INSERT INTO "bingkai_profil" ("id", "kode", "nama", "harga", "gaya", "createdAt")
VALUES
    ('blingkai_001', 'BINGKAI_DASAR', 'Bingkai Dasar', 50, 'border-2 border-guyub-bambuDark rounded-full', CURRENT_TIMESTAMP),
    ('blingkai_002', 'BINGKAI_EMAS', 'Bingkai Emas', 150, 'border-4 border-yellow-400 rounded-full shadow-lg shadow-yellow-400/50', CURRENT_TIMESTAMP),
    ('blingkai_003', 'BINGKAI_PRIMA', 'Bingkai Prima', 300, 'border-4 border-gradient-to-r from-guyub-gula via-guyub-bambuDark to-guyub-gula rounded-full', CURRENT_TIMESTAMP),
    ('blingkai_004', 'BINGKAI_DAERAH', 'Bingkai Daerah', 500, 'border-4 border-dashed border-guyub-merahBata rounded-full', CURRENT_TIMESTAMP);