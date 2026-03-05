-- AlterTable
ALTER TABLE "ProjectSubmission" ADD COLUMN "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
