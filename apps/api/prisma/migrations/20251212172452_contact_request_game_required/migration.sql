/*
  Warnings:

  - Made the column `gameId` on table `ContactRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ContactRequest" DROP CONSTRAINT "ContactRequest_gameId_fkey";

-- AlterTable
ALTER TABLE "ContactRequest" ALTER COLUMN "gameId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
