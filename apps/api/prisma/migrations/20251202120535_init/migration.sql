-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'TEAM_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TeamLevel" AS ENUM ('SEMI_COMPETITIVE', 'NATIONAL', 'INTERNATIONAL', 'ACADEMY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "region" TEXT,
    "timezone" TEXT,
    "languages" TEXT[],
    "availability" JSONB,
    "bio" TEXT,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamProfile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "region" TEXT,
    "timezone" TEXT,
    "languages" TEXT[],
    "bio" TEXT,
    "level" "TeamLevel" NOT NULL DEFAULT 'SEMI_COMPETITIVE',
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRole" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "GameRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGameProfile" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "mainRoles" TEXT[],
    "rankCurrent" TEXT,
    "rankPeak" TEXT,
    "experienceYears" INTEGER,
    "lookingForRole" TEXT,
    "lookingForTeam" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerGameProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameProfile" (
    "id" TEXT NOT NULL,
    "teamProfileId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "level" "TeamLevel" NOT NULL DEFAULT 'SEMI_COMPETITIVE',
    "scrimSchedule" JSONB,
    "trainingSchedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGameProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamGameProfileId" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "roleInGame" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenPosition" (
    "id" TEXT NOT NULL,
    "teamGameProfileId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "minRank" TEXT,
    "maxRank" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamProfileId" TEXT,

    CONSTRAINT "OpenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "openPositionId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");

-- CreateIndex
CREATE INDEX "TeamProfile_ownerUserId_idx" ON "TeamProfile"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_code_key" ON "Game"("code");

-- CreateIndex
CREATE INDEX "GameRole_gameId_idx" ON "GameRole"("gameId");

-- CreateIndex
CREATE INDEX "PlayerGameProfile_playerProfileId_idx" ON "PlayerGameProfile"("playerProfileId");

-- CreateIndex
CREATE INDEX "PlayerGameProfile_gameId_idx" ON "PlayerGameProfile"("gameId");

-- CreateIndex
CREATE INDEX "TeamGameProfile_teamProfileId_idx" ON "TeamGameProfile"("teamProfileId");

-- CreateIndex
CREATE INDEX "TeamGameProfile_gameId_idx" ON "TeamGameProfile"("gameId");

-- CreateIndex
CREATE INDEX "TeamMember_teamGameProfileId_idx" ON "TeamMember"("teamGameProfileId");

-- CreateIndex
CREATE INDEX "TeamMember_playerProfileId_idx" ON "TeamMember"("playerProfileId");

-- CreateIndex
CREATE INDEX "OpenPosition_teamGameProfileId_idx" ON "OpenPosition"("teamGameProfileId");

-- CreateIndex
CREATE INDEX "Application_playerProfileId_idx" ON "Application"("playerProfileId");

-- CreateIndex
CREATE INDEX "Application_openPositionId_idx" ON "Application"("openPositionId");

-- AddForeignKey
ALTER TABLE "PlayerProfile" ADD CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProfile" ADD CONSTRAINT "TeamProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRole" ADD CONSTRAINT "GameRole_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameProfile" ADD CONSTRAINT "PlayerGameProfile_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameProfile" ADD CONSTRAINT "PlayerGameProfile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameProfile" ADD CONSTRAINT "TeamGameProfile_teamProfileId_fkey" FOREIGN KEY ("teamProfileId") REFERENCES "TeamProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameProfile" ADD CONSTRAINT "TeamGameProfile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamGameProfileId_fkey" FOREIGN KEY ("teamGameProfileId") REFERENCES "TeamGameProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_teamGameProfileId_fkey" FOREIGN KEY ("teamGameProfileId") REFERENCES "TeamGameProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenPosition" ADD CONSTRAINT "OpenPosition_teamProfileId_fkey" FOREIGN KEY ("teamProfileId") REFERENCES "TeamProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_openPositionId_fkey" FOREIGN KEY ("openPositionId") REFERENCES "OpenPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
