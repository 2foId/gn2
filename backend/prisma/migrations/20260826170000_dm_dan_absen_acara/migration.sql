-- Pesan direk (DM)
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_receiverId_senderId_idx" ON "messages"("receiverId", "senderId");
CREATE INDEX "messages_senderId_receiverId_idx" ON "messages"("senderId", "receiverId");

ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guyub Acara: target kehadiran & kode absen
ALTER TABLE "acara" ADD COLUMN "targetHadir" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "acara" ADD COLUMN "kodeAbsen" TEXT;
