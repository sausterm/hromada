-- CreateEnum
CREATE TYPE "Category" AS ENUM ('HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'IN_DISCUSSION', 'MATCHED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SOLAR_PV', 'HEAT_PUMP', 'WATER_TREATMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "CofinancingStatus" AS ENUM ('YES', 'NO', 'NEEDS_CLARIFICATION');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "municipalityName" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "briefDescription" VARCHAR(150) NOT NULL,
    "fullDescription" VARCHAR(2000) NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "cityLatitude" DOUBLE PRECISION NOT NULL,
    "cityLongitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "contactPhone" TEXT,
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'OPEN',
    "projectType" "ProjectType",
    "projectSubtype" TEXT,
    "technicalPowerKw" DECIMAL(10,2),
    "numberOfPanels" INTEGER,
    "estimatedCostUsd" DECIMAL(12,2),
    "cofinancingAvailable" "CofinancingStatus",
    "cofinancingDetails" TEXT,
    "partnerOrganization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectImage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_urgency_idx" ON "Project"("urgency");

-- CreateIndex
CREATE INDEX "Project_projectType_idx" ON "Project"("projectType");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectImage_projectId_idx" ON "ProjectImage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectImage_sortOrder_idx" ON "ProjectImage"("sortOrder");

-- CreateIndex
CREATE INDEX "Inquiry_projectId_idx" ON "Inquiry"("projectId");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_read_idx" ON "Inquiry"("read");

-- CreateIndex
CREATE INDEX "ContactSubmission_projectId_idx" ON "ContactSubmission"("projectId");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_handled_idx" ON "ContactSubmission"("handled");

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
