CREATE TYPE "LocalLibraryCategory" AS ENUM ('PERPUSTAKAAN_DAERAH', 'TAMAN_BACA', 'PUSAT_BELAJAR');

CREATE TABLE "library_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "judul" VARCHAR(150) NOT NULL,
    "penulis" VARCHAR(100),
    "tahun" INTEGER,
    "penerbit" VARCHAR(100),
    "tautan" TEXT,
    "catatan" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "local_libraries" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "LocalLibraryCategory" NOT NULL,
    "kabupatenKota" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "jamBuka" TEXT,
    "tautan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "local_libraries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "library_notes_userId_createdAt_idx" ON "library_notes"("userId", "createdAt");
CREATE INDEX "local_libraries_kabupatenKota_kategori_idx" ON "local_libraries"("kabupatenKota", "kategori");

ALTER TABLE "library_notes" ADD CONSTRAINT "library_notes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;