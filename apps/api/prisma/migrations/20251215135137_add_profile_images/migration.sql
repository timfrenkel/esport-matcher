-- AlterTable
ALTER TABLE "PlayerProfile" ADD COLUMN     "profileImageKey" TEXT;

-- AlterTable
ALTER TABLE "TeamProfile" ADD COLUMN     "bannerImageKey" TEXT,
ADD COLUMN     "profileImageKey" TEXT;
