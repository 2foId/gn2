CREATE TABLE "profile_notes" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profile_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "profile_notes_authorId_targetUserId_idx" ON "profile_notes"("authorId", "targetUserId");

ALTER TABLE "profile_notes" ADD CONSTRAINT "profile_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile_notes" ADD CONSTRAINT "profile_notes_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
