-- AlterTable
ALTER TABLE "ProjectUpdate" ADD COLUMN "createdById" TEXT,
ADD COLUMN "createdByName" VARCHAR(100),
ADD COLUMN "createdByRole" VARCHAR(30);

-- AddForeignKey
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
