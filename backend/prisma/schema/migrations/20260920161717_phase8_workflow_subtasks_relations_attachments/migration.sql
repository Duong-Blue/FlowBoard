-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('BLOCKS', 'IS_BLOCKED_BY', 'RELATES_TO', 'DUPLICATES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'SUBTASK_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'SUBTASK_DELETED';
ALTER TYPE "ActivityType" ADD VALUE 'RELATION_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'RELATION_DELETED';
ALTER TYPE "ActivityType" ADD VALUE 'ATTACHMENT_UPLOADED';
ALTER TYPE "ActivityType" ADD VALUE 'ATTACHMENT_DELETED';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "issue_id" TEXT NOT NULL,
    "uploader_id" TEXT,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_relations" (
    "id" TEXT NOT NULL,
    "source_issue_id" TEXT NOT NULL,
    "target_issue_id" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_issue_id_idx" ON "attachments"("issue_id");

-- CreateIndex
CREATE INDEX "attachments_uploader_id_idx" ON "attachments"("uploader_id");

-- CreateIndex
CREATE INDEX "issue_relations_source_issue_id_idx" ON "issue_relations"("source_issue_id");

-- CreateIndex
CREATE INDEX "issue_relations_target_issue_id_idx" ON "issue_relations"("target_issue_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_relations_source_issue_id_target_issue_id_type_key" ON "issue_relations"("source_issue_id", "target_issue_id", "type");

-- CreateIndex
CREATE INDEX "Issue_parent_id_idx" ON "Issue"("parent_id");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_relations" ADD CONSTRAINT "issue_relations_source_issue_id_fkey" FOREIGN KEY ("source_issue_id") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_relations" ADD CONSTRAINT "issue_relations_target_issue_id_fkey" FOREIGN KEY ("target_issue_id") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
