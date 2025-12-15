-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "gameId" TEXT;

-- CreateIndex
CREATE INDEX "ContactRequest_fromUserId_idx" ON "ContactRequest"("fromUserId");

-- CreateIndex
CREATE INDEX "ContactRequest_toUserId_idx" ON "ContactRequest"("toUserId");

-- CreateIndex
CREATE INDEX "ContactRequest_gameId_idx" ON "ContactRequest"("gameId");

-- CreateIndex
CREATE INDEX "ContactRequest_targetPlayerId_idx" ON "ContactRequest"("targetPlayerId");

-- CreateIndex
CREATE INDEX "ContactRequest_targetTeamId_idx" ON "ContactRequest"("targetTeamId");

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
