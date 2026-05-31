-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" SET "onboardingCompleted" = true;
