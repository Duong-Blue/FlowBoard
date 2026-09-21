-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'TYPE_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE 'SUBTASK_PARENT_CHANGED';

-- DropIndex
DROP INDEX "Issue_projectId_key_key";

-- AlterTable
ALTER TABLE "Issue" RENAME COLUMN "completedAt" TO "completed_at";
ALTER TABLE "Issue" RENAME COLUMN "dueDate" TO "due_date";
ALTER TABLE "Issue" RENAME COLUMN "startDate" TO "start_date";

ALTER TABLE "Issue" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "Issue" ALTER COLUMN "due_date" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "Issue" ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMPTZ;
ALTER TABLE "Issue" ALTER COLUMN "key" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Issue_projectId_due_date_idx" ON "Issue"("projectId", "due_date");

CREATE UNIQUE INDEX "Issue_projectId_key_unique" ON "Issue"("projectId", "key") WHERE "key" IS NOT NULL;
