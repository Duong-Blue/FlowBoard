/*
  Warnings:

  - You are about to drop the `issue_activities` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "ActivityScope" AS ENUM ('ISSUE', 'PROJECT', 'ORGANIZATION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_MEMBER_ADDED';
ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_MEMBER_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'ORG_MEMBER_ADDED';
ALTER TYPE "ActivityType" ADD VALUE 'ORG_MEMBER_REMOVED';

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "SavedView" DROP CONSTRAINT "SavedView_createdById_fkey";

-- DropForeignKey
ALTER TABLE "issue_activities" DROP CONSTRAINT "issue_activities_actorId_fkey";

-- DropForeignKey
ALTER TABLE "issue_activities" DROP CONSTRAINT "issue_activities_issueId_fkey";

-- AlterTable
ALTER TABLE "Issue" ALTER COLUMN "reporterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';

-- DropTable
DROP TABLE "issue_activities";

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "actorId" TEXT,
    "type" "ActivityType" NOT NULL,
    "entityType" "ActivityScope" NOT NULL DEFAULT 'ISSUE',
    "projectId" TEXT,
    "organizationId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_projectId_createdAt_id_idx" ON "activities"("projectId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "activities_organizationId_createdAt_id_idx" ON "activities"("organizationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "activities_actorId_idx" ON "activities"("actorId");

-- CreateIndex
CREATE INDEX "Issue_title_idx" ON "Issue" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Issue_description_idx" ON "Issue" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Project_key_idx" ON "Project" USING GIN ("key" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
