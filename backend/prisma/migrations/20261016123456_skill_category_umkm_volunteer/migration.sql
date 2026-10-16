-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('FOTO_PRODUK', 'DESAIN', 'PEMASARAN_MEDSOS', 'MARKETPLACE', 'PEMBUKUAN', 'VIDEO_PENDEK', 'LAINNYA');

-- AlterTable
ALTER TABLE "umkm_needs" ADD COLUMN     "category" "SkillCategory" NOT NULL DEFAULT 'LAINNYA';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "keahlian" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "keahlian" TYPE "SkillCategory"[] USING "keahlian"::"SkillCategory"[];
ALTER TABLE "users" ALTER COLUMN "keahlian" SET DEFAULT '{}';
