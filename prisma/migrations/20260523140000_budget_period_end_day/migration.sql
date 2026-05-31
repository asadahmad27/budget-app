-- AlterTable
ALTER TABLE "User" ADD COLUMN "budgetPeriodEndDay" INTEGER NOT NULL DEFAULT 31;

UPDATE "User"
SET "budgetPeriodEndDay" = CASE
  WHEN "budgetPeriodStartDay" = 1 THEN 31
  ELSE "budgetPeriodStartDay" - 1
END;
