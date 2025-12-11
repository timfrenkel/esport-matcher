/*
  Warnings:

  - The values [USER,TEAM_MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Game` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GameRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `isActive` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `maxRank` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `teamGameProfileId` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `lookingForRole` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `mainRoles` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rankCurrent` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `rankPeak` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `TeamGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `scrimSchedule` on the `TeamGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `trainingSchedule` on the `TeamGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `TeamProfile` table. All the data in the column will be lost.
  - You are about to drop the column `ownerUserId` on the `TeamProfile` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `TeamProfile` table. All the data in the column will be lost.
  - The `level` column on the `TeamProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gameId,code]` on the table `GameRole` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playerProfileId,gameId]` on the table `PlayerGameProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamProfileId,gameId]` on the table `TeamGameProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `TeamProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GameRole` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameId` to the `OpenPosition` table without a default value. This is not possible if the table is not empty.
  - Made the column `teamProfileId` on table `OpenPosition` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `TeamProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OpenPositionStatus" AS ENUM ('OPEN', 'CLOSED', 'FILLED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('PLAYER', 'TEAM', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PLAYER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_openPositionId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "GameRole" DROP CONSTRAINT "GameRole_gameId_fkey";

-- DropForeignKey
ALTER TABLE "OpenPosition" DROP CONSTRAINT "OpenPosition_teamGameProfileId_fkey";

-- DropForeignKey
ALTER TABLE "OpenPosition" DROP CONSTRAINT "OpenPosition_teamProfileId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerGameProfile" DROP CONSTRAINT "PlayerGameProfile_gameId_fkey";

-- DropForeignKey
ALTER TABLE "TeamGameProfile" DROP CONSTRAINT "TeamGameProfile_gameId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamGameProfileId_fkey";

-- DropForeignKey
ALTER TABLE "TeamProfile" DROP CONSTRAINT "TeamProfile_ownerUserId_fkey";

-- DropIndex
DROP INDEX "GameRole_gameId_idx";

-- DropIndex
DROP INDEX "OpenPosition_teamGameProfileId_idx";

-- DropIndex
DROP INDEX "PlayerGameProfile_gameId_idx";

-- DropIndex
DROP INDEX "PlayerGameProfile_playerProfileId_idx";

-- DropIndex
DROP INDEX "TeamGameProfile_gameId_idx";

-- DropIndex
DROP INDEX "TeamGameProfile_teamProfileId_idx";

-- DropIndex
DROP INDEX "TeamProfile_ownerUserId_idx";

-- AlterTable
ALTER TABLE "Game" DROP CONSTRAINT "Game_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rankSchema" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Game_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Game_id_seq";

-- AlterTable
ALTER TABLE "GameRole" DROP CONSTRAINT "GameRole_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "gameId" SET DATA TYPE TEXT,
ADD CONSTRAINT "GameRole_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "GameRole_id_seq";

-- AlterTable
ALTER TABLE "OpenPosition" DROP COLUMN "isActive",
DROP COLUMN "maxRank",
DROP COLUMN "role",
DROP COLUMN "teamGameProfileId",
ADD COLUMN     "gameId" TEXT NOT NULL,
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "status" "OpenPositionStatus" NOT NULL DEFAULT 'OPEN',
ALTER COLUMN "teamProfileId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PlayerGameProfile" DROP COLUMN "experienceYears",
DROP COLUMN "lookingForRole",
DROP COLUMN "mainRoles",
DROP COLUMN "rankCurrent",
DROP COLUMN "rankPeak",
ADD COLUMN     "mmr" INTEGER,
ADD COLUMN     "primaryRoleId" TEXT,
ADD COLUMN     "rank" TEXT,
ALTER COLUMN "gameId" SET DATA TYPE TEXT,
ALTER COLUMN "lookingForTeam" SET DEFAULT false;

-- AlterTable
ALTER TABLE "PlayerProfile" ALTER COLUMN "displayName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TeamGameProfile" DROP COLUMN "level",
DROP COLUMN "scrimSchedule",
DROP COLUMN "trainingSchedule",
ADD COLUMN     "competitiveLevel" TEXT,
ADD COLUMN     "schedule" JSONB,
ALTER COLUMN "gameId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "TeamProfile" DROP COLUMN "languages",
DROP COLUMN "ownerUserId",
DROP COLUMN "timezone",
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
DROP COLUMN "level",
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'semi';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PLAYER';

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "TeamMember";

-- DropEnum
DROP TYPE "ApplicationStatus";

-- DropEnum
DROP TYPE "TeamLevel";

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "playerProfileId" TEXT,
    "teamProfileId" TEXT,
    "gameId" TEXT,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "durationSeconds" INTEGER,
    "title" TEXT,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "playerProfileId" TEXT,
    "teamProfileId" TEXT,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRole_gameId_code_key" ON "GameRole"("gameId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameProfile_playerProfileId_gameId_key" ON "PlayerGameProfile"("playerProfileId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameProfile_teamProfileId_gameId_key" ON "TeamGameProfile"("teamProfileId", "gameId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamProfile_userId_key" ON "TeamProfile"("userId");

-- AddForeignKey
ALTER TABLE "TeamProfile" ADD CONSTRAINT "TeamProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRole" ADD CONSTRAINT "GameRole_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameProfile" ADD CONSTRAINT "PlayerGameProfile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameProfile" ADD CONSTRAINT "PlayerGameProfile_primaryRoleId_fkey" FOREIGN KEY ("primaryRoleId") REFERENCES "GameRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameProfile" ADD CONSTRAINT "TeamGameProfile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_teamProfileId_fkey" FOREIGN KEY ("teamProfileId") REFERENCES "TeamProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "GameRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_teamProfileId_fkey" FOREIGN KEY ("teamProfileId") REFERENCES "TeamProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_teamProfileId_fkey" FOREIGN KEY ("teamProfileId") REFERENCES "TeamProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
