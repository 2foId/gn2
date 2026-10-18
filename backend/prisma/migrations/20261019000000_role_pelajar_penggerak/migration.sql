ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "Role_new" AS ENUM ('PELAJAR', 'PENGGERAK', 'ADMIN');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'WARGA' THEN 'PELAJAR'
      WHEN 'RELAWAN' THEN 'PENGGERAK'
      ELSE "role"::text
    END
  )::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PELAJAR';
ALTER TABLE "users" ADD COLUMN "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "onboardingDone" = true WHERE "emailVerifiedAt" IS NOT NULL;
UPDATE "users" SET "phone" = NULL WHERE "role" = 'PELAJAR';