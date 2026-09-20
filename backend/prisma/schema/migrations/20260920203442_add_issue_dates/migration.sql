-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'START_DATE_SET';
ALTER TYPE "ActivityType" ADD VALUE 'START_DATE_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE 'START_DATE_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'DUE_DATE_SET';
ALTER TYPE "ActivityType" ADD VALUE 'DUE_DATE_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE 'DUE_DATE_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'ISSUE_COMPLETED';
ALTER TYPE "ActivityType" ADD VALUE 'ISSUE_REOPENED';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);
