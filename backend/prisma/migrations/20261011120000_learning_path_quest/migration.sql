-- Set the default for new wasiat records and migrate the learning-step text to tujuan.
ALTER TABLE "wasiat" ALTER COLUMN "kategori" SET DEFAULT 'BEBAS';
ALTER TABLE "wasiat_langkah" RENAME COLUMN "konten" TO "tujuan";
ALTER TABLE "wasiat_langkah"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "wasiat_langkah" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Keep legacy progress long enough to expand it into one row per completed quest.
CREATE TEMP TABLE "_wasiat_progress_legacy" AS
SELECT "id", "userId", "wasiatId", "langkahSelesai", "skor", "selesaiAt", "catatan", "createdAt", "updatedAt"
FROM "wasiat_progress";
DROP TABLE "wasiat_progress";

CREATE TABLE "wasiat_progress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "wasiatId" TEXT NOT NULL,
  "langkahId" TEXT NOT NULL,
  "skor" INTEGER NOT NULL DEFAULT 0,
  "lulus" BOOLEAN NOT NULL DEFAULT false,
  "percobaan" INTEGER NOT NULL DEFAULT 1,
  "selesaiAt" TIMESTAMP(3),
  "feedbackCatatan" TEXT,
  "feedbackAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wasiat_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wasiat_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "wasiat_progress_wasiatId_fkey" FOREIGN KEY ("wasiatId") REFERENCES "wasiat"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "wasiat_progress_langkahId_fkey" FOREIGN KEY ("langkahId") REFERENCES "wasiat_langkah"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "wasiat_progress" (
  "id", "userId", "wasiatId", "langkahId", "skor", "lulus", "percobaan",
  "selesaiAt", "feedbackCatatan", "feedbackAt", "createdAt", "updatedAt"
)
SELECT
  md5(legacy."id" || step."id"),
  legacy."userId",
  legacy."wasiatId",
  step."id",
  CASE WHEN step."urutan" < legacy."langkahSelesai" THEN 100 ELSE legacy."skor" END,
  (step."urutan" < legacy."langkahSelesai" OR legacy."selesaiAt" IS NOT NULL),
  1,
  CASE WHEN step."urutan" < legacy."langkahSelesai" THEN legacy."updatedAt" ELSE legacy."selesaiAt" END,
  CASE WHEN step."urutan" = legacy."langkahSelesai" THEN legacy."catatan" ELSE NULL END,
  CASE WHEN step."urutan" = legacy."langkahSelesai" AND legacy."catatan" IS NOT NULL THEN legacy."updatedAt" ELSE NULL END,
  legacy."createdAt",
  legacy."updatedAt"
FROM "_wasiat_progress_legacy" AS legacy
JOIN "wasiat_langkah" AS step
  ON step."wasiatId" = legacy."wasiatId"
 AND step."urutan" <= legacy."langkahSelesai";
DROP TABLE "_wasiat_progress_legacy";

CREATE UNIQUE INDEX "wasiat_progress_userId_langkahId_key"
  ON "wasiat_progress"("userId", "langkahId");
CREATE INDEX "wasiat_progress_wasiatId_userId_idx"
  ON "wasiat_progress"("wasiatId", "userId");
CREATE INDEX "wasiat_progress_langkahId_userId_idx"
  ON "wasiat_progress"("langkahId", "userId");
