/*
  Warnings:

  - You are about to drop the column `playerProfileId` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `teamProfileId` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `isVisible` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `minRank` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `teamProfileId` on the `OpenPosition` table. All the data in the column will be lost.
  - You are about to drop the column `lookingForTeam` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `mmr` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `playerProfileId` on the `PlayerGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `availability` on the `PlayerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `authorUserId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isPinned` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `playerProfileId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `teamProfileId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `TeamGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `teamProfileId` on the `TeamGameProfile` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `teamId` to the `OpenPosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `OpenPosition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playerId` to the `PlayerGameProfile` table without a default value. This is not possible if the table is not empty.
  - Made the column `displayName` on table `PlayerProfile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `TeamGameProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT "Clip_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT "Clip_teamProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT "Clip_userId_fkey";

-- DropForeignKey
ALTER TABLE "OpenPosition" DROP CONSTRAINT "OpenPosition_teamProfileId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerGameProfile" DROP CONSTRAINT "PlayerGameProfile_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorUserId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_playerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_teamProfileId_fkey";

-- DropForeignKey
ALTER TABLE "TeamGameProfile" DROP CONSTRAINT "TeamGameProfile_teamProfileId_fkey";

-- DropIndex
DROP INDEX "PlayerGameProfile_playerProfileId_gameId_key";

-- DropIndex
DROP INDEX "TeamGameProfile_teamProfileId_gameId_key";

-- AlterTable
ALTER TABLE "Clip" DROP COLUMN "playerProfileId",
DROP COLUMN "teamProfileId",
DROP COLUMN "userId",
ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "OpenPosition" DROP COLUMN "isVisible",
DROP COLUMN "minRank",
DROP COLUMN "teamProfileId",
ADD COLUMN     "requiredLevel" TEXT,
ADD COLUMN     "requiredRank" TEXT,
ADD COLUMN     "teamId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlayerGameProfile" DROP COLUMN "lookingForTeam",
DROP COLUMN "mmr",
DROP COLUMN "playerProfileId",
ADD COLUMN     "playerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlayerProfile" DROP COLUMN "availability",
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'semi',
ADD COLUMN     "lookingForLevel" TEXT,
ADD COLUMN     "lookingForRole" TEXT,
ALTER COLUMN "displayName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "authorUserId",
DROP COLUMN "isDeleted",
DROP COLUMN "isPinned",
DROP COLUMN "playerProfileId",
DROP COLUMN "teamProfileId",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TeamGameProfile" DROP COLUMN "schedule",
DROP COLUMN "teamProfileId",
ADD COLUMN     "primaryRoleId" TEXT,
ADD COLUMN     "rank" TEXT,
ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PositionApplication" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "positionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "PositionApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayerGameProfile" ADD CONSTRAINT "PlayerGameProfile_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameProfile" ADD CONSTRAINT "TeamGameProfile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameProfile" ADD CONSTRAINT "TeamGameProfile_primaryRoleId_fkey" FOREIGN KEY ("primaryRoleId") REFERENCES "GameRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionApplication" ADD CONSTRAINT "PositionApplication_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "OpenPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionApplication" ADD CONSTRAINT "PositionApplication_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
