-- Add email column (nullable during transition)
ALTER TABLE "users" ADD COLUMN "email" TEXT;

-- Add emailVerifiedAt column
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Drop unique constraint on kontak, make kontak nullable
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_kontak_key";
ALTER TABLE "users" ALTER COLUMN "kontak" DROP NOT NULL;

-- Drop kontakVerified column
ALTER TABLE "users" DROP COLUMN IF EXISTS "kontakVerified";

-- Drop otp_codes table
DROP TABLE IF EXISTS "otp_codes";

-- Create email_tokens table
CREATE TABLE "email_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id")
);

-- Create unique index on tokenHash
CREATE UNIQUE INDEX "email_tokens_tokenHash_key" ON "email_tokens"("tokenHash");

-- Add foreign key
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add unique constraint on email
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
