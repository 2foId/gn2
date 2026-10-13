-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "themePreference" "ThemePreference" NOT NULL DEFAULT 'LIGHT';

-- AlterTable
ALTER TABLE "wasiat_langkah" ADD COLUMN     "jawabanDiacak" BOOLEAN NOT NULL DEFAULT false;
