-- CreateTable
CREATE TABLE "GameRank" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" TEXT NOT NULL,
    "roleId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "GameRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRank_gameId_code_roleId_key" ON "GameRank"("gameId", "code", "roleId");

-- AddForeignKey
ALTER TABLE "GameRank" ADD CONSTRAINT "GameRank_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRank" ADD CONSTRAINT "GameRank_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "GameRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
