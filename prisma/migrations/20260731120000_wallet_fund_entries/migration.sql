-- CreateTable
CREATE TABLE "WalletFundEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "budgetMonthId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletFundEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletFundEntry_userId_idx" ON "WalletFundEntry"("userId");

-- CreateIndex
CREATE INDEX "WalletFundEntry_budgetMonthId_walletId_idx" ON "WalletFundEntry"("budgetMonthId", "walletId");

-- AddForeignKey
ALTER TABLE "WalletFundEntry" ADD CONSTRAINT "WalletFundEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletFundEntry" ADD CONSTRAINT "WalletFundEntry_budgetMonthId_fkey" FOREIGN KEY ("budgetMonthId") REFERENCES "BudgetMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletFundEntry" ADD CONSTRAINT "WalletFundEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one entry per existing addedAmount so history is editable/deletable
INSERT INTO "WalletFundEntry" ("id", "userId", "budgetMonthId", "walletId", "amount", "note", "date", "createdAt")
SELECT
  'c' || replace(gen_random_uuid()::text, '-', ''),
  bm."userId",
  wm."budgetMonthId",
  wm."walletId",
  wm."addedAmount",
  'Previously added funds',
  bm."createdAt",
  CURRENT_TIMESTAMP
FROM "WalletMonth" wm
JOIN "BudgetMonth" bm ON bm."id" = wm."budgetMonthId"
WHERE wm."addedAmount" > 0;
