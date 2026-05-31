-- CreateTable
CREATE TABLE "LifeGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "projectedCost" DECIMAL(12,2) NOT NULL,
    "savedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "walletId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeGoal_userId_idx" ON "LifeGoal"("userId");

-- CreateIndex
CREATE INDEX "LifeGoal_walletId_idx" ON "LifeGoal"("walletId");

-- AddForeignKey
ALTER TABLE "LifeGoal" ADD CONSTRAINT "LifeGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifeGoal" ADD CONSTRAINT "LifeGoal_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
