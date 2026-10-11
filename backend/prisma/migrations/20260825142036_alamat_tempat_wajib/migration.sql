/*
  Warnings:

  - Made the column `alamat` on table `bantuan_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bantuan_requests" ALTER COLUMN "alamat" SET NOT NULL;
