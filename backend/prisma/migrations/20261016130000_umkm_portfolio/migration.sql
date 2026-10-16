-- CreateTable
CREATE TABLE "umkm_portfolios" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "umkmNeedId" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "beforeImageUrl" TEXT NOT NULL,
    "afterImageUrl" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umkm_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umkm_portfolios_responseId_key" ON "umkm_portfolios"("responseId");

-- AddForeignKey
ALTER TABLE "umkm_portfolios" ADD CONSTRAINT "umkm_portfolios_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "umkm_responses"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_portfolios" ADD CONSTRAINT "umkm_portfolios_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "users"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_portfolios" ADD CONSTRAINT "umkm_portfolios_umkmNeedId_fkey" FOREIGN KEY ("umkmNeedId") REFERENCES "umkm_needs"("id") ON DELETE CASCADE;
