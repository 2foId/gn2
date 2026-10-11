DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PreferensiRelawan') THEN
        CREATE TYPE "PreferensiRelawan" AS ENUM ('SEMUA', 'PEMUDA_18_30', 'BERPENGALAMAN');
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WasiatKategori') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'WasiatKategori' AND e.enumlabel = 'KULINER'
        ) THEN
            CREATE TYPE "WasiatKategori_new" AS ENUM (
                'RESEP',
                'KERAJINAN',
                'PERTANIAN',
                'FILOSOFI',
                'LITERASI_DIGITAL',
                'LITERASI_KEUANGAN',
                'LITERASI_KESEHATAN',
                'SEJARAH_BUDAYA',
                'BEBAS'
            );

            ALTER TABLE "wasiat"
                ALTER COLUMN "kategori" TYPE "WasiatKategori_new"
                USING CASE "kategori"::text
                    WHEN 'KULINER' THEN 'RESEP'::"WasiatKategori_new"
                    ELSE "kategori"::text::"WasiatKategori_new"
                END;

            DROP TYPE "WasiatKategori";
            ALTER TYPE "WasiatKategori_new" RENAME TO "WasiatKategori";
        END IF;
    ELSE
        CREATE TYPE "WasiatKategori" AS ENUM (
            'RESEP',
            'KERAJINAN',
            'PERTANIAN',
            'FILOSOFI',
            'LITERASI_DIGITAL',
            'LITERASI_KEUANGAN',
            'LITERASI_KESEHATAN',
            'SEJARAH_BUDAYA',
            'BEBAS'
        );
    END IF;
END $$;

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "keahlian" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "tanggalLahir" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "ketersediaan" TEXT;

ALTER TABLE "bantuan_requests"
    ADD COLUMN IF NOT EXISTS "preferensiRelawan" "PreferensiRelawan" NOT NULL DEFAULT 'SEMUA';

CREATE TABLE IF NOT EXISTS "wasiat_langkah"
(
    "id" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "kuis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wasiat_langkah_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wasiat_langkah_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "wasiat_progress"
(
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "langkahSelesai" INTEGER NOT NULL DEFAULT 0,
    "skor" INTEGER NOT NULL DEFAULT 0,
    "selesaiAt" TIMESTAMP(3),
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wasiat_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wasiat_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wasiat_progress_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "wasiat_saved"
(
    "id" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wasiat_saved_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wasiat_saved_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wasiat_saved_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "wasiat_comments"
(
    "id" TEXT NOT NULL,
    "wasiatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wasiat_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wasiat_comments_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wasiat_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "wasiat_langkah_wasiatId_urutan_key"
    ON "wasiat_langkah" ("wasiatId", "urutan");

CREATE UNIQUE INDEX IF NOT EXISTS "wasiat_progress_userId_wasiatId_key"
    ON "wasiat_progress" ("userId", "wasiatId");

CREATE INDEX IF NOT EXISTS "wasiat_progress_wasiatId_userId_idx"
    ON "wasiat_progress" ("wasiatId", "userId");

CREATE UNIQUE INDEX IF NOT EXISTS "wasiat_saved_wasiatId_userId_key"
    ON "wasiat_saved" ("wasiatId", "userId");

ALTER TABLE "wasiat"
    DROP CONSTRAINT IF EXISTS "wasiat_penulisId_fkey";

ALTER TABLE "wasiat"
    ADD CONSTRAINT "wasiat_penulisId_fkey"
    FOREIGN KEY ("penulisId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
