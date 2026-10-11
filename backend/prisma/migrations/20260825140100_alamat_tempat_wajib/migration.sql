UPDATE "bantuan_requests"
SET "alamat" = 'Belum dicantumkan'
WHERE "alamat" IS NULL;

ALTER TABLE "bantuan_requests"
ALTER COLUMN "alamat" SET NOT NULL;
