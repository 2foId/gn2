-- CreateTable
CREATE TABLE "umkm_ratings" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "umkm_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umkm_ratings_responseId_fromUserId_key" ON "umkm_ratings"("responseId", "fromUserId");

-- AddForeignKey
ALTER TABLE "umkm_ratings" ADD CONSTRAINT "umkm_ratings_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "umkm_responses"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_ratings" ADD CONSTRAINT "umkm_ratings_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "umkm_ratings" ADD CONSTRAINT "umkm_ratings_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE;
